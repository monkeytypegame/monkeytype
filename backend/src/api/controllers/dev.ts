import { MonkeyResponse2 } from "../../utils/monkey-response";
import * as UserDal from "../../dal/user";
import FirebaseAdmin from "../../init/firebase-admin";
import Logger from "../../utils/logger";
import * as DateUtils from "date-fns";
import { UTCDate } from "@date-fns/utc";
import * as ResultDal from "../../dal/result";
import { roundTo2 } from "../../utils/misc";
import { ObjectId } from "mongodb";
import * as LeaderboardDal from "../../dal/leaderboards";
import MonkeyError from "../../utils/error";

import {
  Mode,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/contracts/schemas/shared";
import {
  GenerateDataRequest,
  GenerateDataResponse,
} from "@monkeytype/contracts/dev";

const CREATE_RESULT_DEFAULT_OPTIONS = {
  firstTestTimestamp: DateUtils.startOfDay(new UTCDate(Date.now())).valueOf(),
  lastTestTimestamp: DateUtils.endOfDay(new UTCDate(Date.now())).valueOf(),
  minTestsPerDay: 0,
  maxTestsPerDay: 50,
};

export async function createTestData(
  req: MonkeyTypes.Request2<undefined, GenerateDataRequest>
): Promise<GenerateDataResponse> {
  const { username, createUser } = req.body;
  const user = await getOrCreateUser(username, "password", createUser);

  const { uid, email } = user;

  await createTestResults(user, req.body);
  await updateUser(uid);
  await updateLeaderboard();

  return new MonkeyResponse2("test data created", { uid, email });
}

async function getOrCreateUser(
  username: string,
  password: string,
  createUser = false
): Promise<MonkeyTypes.DBUser> {
  const existingUser = await UserDal.findByName(username);

  if (existingUser !== undefined && existingUser !== null) {
    return existingUser;
  } else if (!createUser) {
    throw new MonkeyError(404, `User ${username} does not exist.`);
  }

  const email = username + "@example.com";
  Logger.success("create user " + username);
  const { uid } = await FirebaseAdmin().auth().createUser({
    displayName: username,
    password: password,
    email,
    emailVerified: true,
  });

  await UserDal.addUser(username, email, uid);
  return UserDal.getUser(uid, "getOrCreateUser");
}

async function createTestResults(
  user: MonkeyTypes.DBUser,
  configOptions: GenerateDataRequest
): Promise<void> {
  const config = {
    ...CREATE_RESULT_DEFAULT_OPTIONS,
    ...configOptions,
  };
  const start = toDate(config.firstTestTimestamp);
  const end = toDate(config.lastTestTimestamp);

  const days = DateUtils.eachDayOfInterval({
    start,
    end,
  }).map((day) => ({
    timestamp: DateUtils.startOfDay(day),
    amount: Math.round(random(config.minTestsPerDay, config.maxTestsPerDay)),
  }));

  for (const day of days) {
    Logger.success(
      `User ${user.name} insert ${day.amount} results on ${new Date(
        day.timestamp
      )}`
    );
    const results = createArray(day.amount, () =>
      createResult(user, day.timestamp)
    );
    if (results.length > 0)
      await ResultDal.getResultCollection().insertMany(results);
  }
}

function toDate(value: number): Date {
  return new UTCDate(value);
}

function random(min: number, max: number): number {
  return roundTo2(Math.random() * (max - min) + min);
}

function createResult(
  user: MonkeyTypes.DBUser,
  timestamp: Date //evil, we modify this value
): MonkeyTypes.DBResult {
  const mode: Mode = randomValue(["time", "words"]);
  const mode2: number =
    mode === "time"
      ? randomValue([15, 30, 60, 120])
      : randomValue([10, 25, 50, 100]);
  const testDuration = mode2;

  timestamp = DateUtils.addSeconds(timestamp, testDuration);
  return {
    _id: new ObjectId(),
    uid: user.uid,
    wpm: random(80, 120),
    rawWpm: random(80, 120),
    charStats: [131, 0, 0, 0],
    acc: random(80, 100),
    language: "english",
    mode: mode as Mode,
    mode2: mode2 as unknown as never,
    timestamp: timestamp.valueOf(),
    testDuration: testDuration,
    consistency: random(80, 100),
    keyConsistency: 33.18,
    chartData: {
      wpm: createArray(testDuration, () => random(80, 120)),
      raw: createArray(testDuration, () => random(80, 120)),
      err: createArray(testDuration, () => (Math.random() < 0.1 ? 1 : 0)),
    },
    keySpacingStats: {
      average: 113.88,
      sd: 77.3,
    },
    keyDurationStats: {
      average: 107.13,
      sd: 39.86,
    },
    isPb: Math.random() < 0.1,
    name: user.name,
  };
}

async function updateUser(uid: string): Promise<void> {
  //update timetyping and completedTests
  const stats = await ResultDal.getResultCollection()
    .aggregate([
      {
        $match: {
          uid,
        },
      },
      {
        $group: {
          _id: {
            language: "$language",
            mode: "$mode",
            mode2: "$mode2",
          },
          timeTyping: {
            $sum: "$testDuration",
          },
          completedTests: {
            $count: {},
          },
        },
      },
    ])
    .toArray();

  const timeTyping = stats.reduce((a, c) => (a + c["timeTyping"]) as number, 0);
  const completedTests = stats.reduce(
    (a, c) => (a + c["completedTests"]) as number,
    0
  );

  //update PBs
  const lbPersonalBests: MonkeyTypes.LbPersonalBests = {
    time: {
      15: {},
      60: {},
    },
  };

  const personalBests: PersonalBests = {
    time: {},
    custom: {},
    words: {},
    zen: {},
    quote: {},
  };
  const modes = stats.map(
    (it) =>
      it["_id"] as {
        language: string;
        mode: "time" | "custom" | "words" | "quote" | "zen";
        mode2: `${number}` | "custom" | "zen";
      }
  );

  for (const mode of modes) {
    const best = (
      await ResultDal.getResultCollection()
        .find({
          uid,
          language: mode.language,
          mode: mode.mode,
          mode2: mode.mode2,
        })
        .sort({ wpm: -1, timestamp: 1 })
        .limit(1)
        .toArray()
    )[0] as MonkeyTypes.DBResult;

    if (personalBests[mode.mode] === undefined) personalBests[mode.mode] = {};
    if (personalBests[mode.mode][mode.mode2] === undefined)
      personalBests[mode.mode][mode.mode2] = [];

    const entry = {
      acc: best.acc,
      consistency: best.consistency,
      difficulty: best.difficulty ?? "normal",
      lazyMode: best.lazyMode,
      language: mode.language,
      punctuation: best.punctuation,
      raw: best.rawWpm,
      wpm: best.wpm,
      numbers: best.numbers,
      timestamp: best.timestamp,
    } as PersonalBest;

    personalBests[mode.mode][mode.mode2].push(entry);

    if (mode.mode === "time") {
      if (lbPersonalBests[mode.mode][mode.mode2] === undefined)
        lbPersonalBests[mode.mode][mode.mode2] = {};

      lbPersonalBests[mode.mode][mode.mode2][mode.language] = entry;
    }

    //update testActivity
    await updateTestActicity(uid);
  }

  //update the user
  await UserDal.getUsersCollection().updateOne(
    { uid },
    {
      $set: {
        timeTyping: timeTyping,
        completedTests: completedTests,
        startedTests: Math.round(completedTests * 1.25),
        personalBests: personalBests,
        lbPersonalBests: lbPersonalBests,
      },
    }
  );
}

async function updateLeaderboard(): Promise<void> {
  await LeaderboardDal.update("time", "15", "english");
  await LeaderboardDal.update("time", "60", "english");
}

function randomValue<T>(values: T[]): T {
  const rnd = Math.round(Math.random() * (values.length - 1));
  return values[rnd] as T;
}

function createArray<T>(size: number, builder: () => T): T[] {
  return new Array(size).fill(0).map(() => builder());
}

async function updateTestActicity(uid: string): Promise<void> {
  await ResultDal.getResultCollection()
    .aggregate(
      [
        {
          $match: {
            uid,
          },
        },
        {
          $project: {
            _id: 0,
            timestamp: -1,
            uid: 1,
          },
        },
        {
          $addFields: {
            date: {
              $toDate: "$timestamp",
            },
          },
        },
        {
          $replaceWith: {
            uid: "$uid",
            year: {
              $year: "$date",
            },
            day: {
              $dayOfYear: "$date",
            },
          },
        },
        {
          $group: {
            _id: {
              uid: "$uid",
              year: "$year",
              day: "$day",
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $group: {
            _id: {
              uid: "$_id.uid",
              year: "$_id.year",
            },
            days: {
              $addToSet: {
                day: "$_id.day",
                tests: "$count",
              },
            },
          },
        },
        {
          $replaceWith: {
            uid: "$_id.uid",
            days: {
              $function: {
                lang: "js",
                args: ["$days", "$_id.year"],
                body: `function (days, year) {
                                var max = Math.max(
                                    ...days.map((it) => it.day)
                                )-1;
                                var arr = new Array(max).fill(null);
                                for (day of days) {
                                    arr[day.day-1] = day.tests;
                                }
                                let result = {};
                                result[year] = arr;
                                return result;
                            }`,
              },
            },
          },
        },
        {
          $group: {
            _id: "$uid",
            testActivity: {
              $mergeObjects: "$days",
            },
          },
        },
        {
          $addFields: {
            uid: "$_id",
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
        {
          $merge: {
            into: "users",
            on: "uid",
            whenMatched: "merge",
            whenNotMatched: "discard",
          },
        },
      ],
      { allowDiskUse: true }
    )
    .toArray();
}
