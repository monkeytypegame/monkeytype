import * as db from "../init/db";
import Logger from "../utils/logger";
import { performance } from "perf_hooks";
import { setLeaderboard } from "../utils/prometheus";
import { isDevEnvironment } from "../utils/misc";

const leaderboardUpdating: { [key: string]: boolean } = {};

export async function get(
  mode: string,
  mode2: string,
  language: string,
  skip: number,
  limit = 50
): Promise<MonkeyTypes.LeaderboardEntry[] | false> {
  if (leaderboardUpdating[`${language}_${mode}_${mode2}`]) return false;
  if (limit > 50 || limit <= 0) limit = 50;
  if (skip < 0) skip = 0;
  const preset = await db
    .collection<MonkeyTypes.LeaderboardEntry>(
      `leaderboards.${language}.${mode}.${mode2}`
    )
    .find()
    .sort({ rank: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return preset;
}

interface GetRankResponse {
  count: number;
  rank: number | null;
  entry: MonkeyTypes.LeaderboardEntry | null;
}

export async function getRank(
  mode: string,
  mode2: string,
  language: string,
  uid: string
): Promise<GetRankResponse | false | void> {
  if (leaderboardUpdating[`${language}_${mode}_${mode2}`]) return false;
  const entry = await db
    .collection<MonkeyTypes.LeaderboardEntry>(
      `leaderboards.${language}.${mode}.${mode2}`
    )
    .findOne({ uid });
  const count = await db
    .collection(`leaderboards.${language}.${mode}.${mode2}`)
    .estimatedDocumentCount();

  return {
    count,
    rank: entry ? entry.rank : null,
    entry,
  };
}

export async function update(
  mode: string,
  mode2: string,
  language: string
): Promise<{
  message: string;
  rank?: number;
}> {
  const key = `lbPersonalBests.${mode}.${mode2}.${language}`;
  const lbCollectionName = `leaderboards.${language}.${mode}.${mode2}`;
  leaderboardUpdating[`${language}_${mode}_${mode2}`] = true;
  const start1 = performance.now();
  const lb = db
    .collection<MonkeyTypes.User>("users")
    .aggregate<MonkeyTypes.LeaderboardEntry>(
      [
        {
          $match: {
            [`${key}.wpm`]: {
              $gt: 0,
            },
            [`${key}.acc`]: {
              $gt: 0,
            },
            [`${key}.timestamp`]: {
              $gt: 0,
            },
            banned: {
              $ne: true,
            },
            lbOptOut: {
              $ne: true,
            },
            needsToChangeName: {
              $ne: true,
            },
            timeTyping: {
              $gt: isDevEnvironment() ? 0 : 7200,
            },
          },
        },
        {
          $sort: {
            [`${key}.wpm`]: -1,
            [`${key}.acc`]: -1,
            [`${key}.timestamp`]: -1,
          },
        },
        {
          $project: {
            _id: 0,
            [`${key}.wpm`]: 1,
            [`${key}.acc`]: 1,
            [`${key}.raw`]: 1,
            [`${key}.consistency`]: 1,
            [`${key}.timestamp`]: 1,
            uid: 1,
            name: 1,
            discordId: 1,
            discordAvatar: 1,
            inventory: 1,
          },
        },

        {
          $addFields: {
            [`${key}.uid`]: "$uid",
            [`${key}.name`]: "$name",
            [`${key}.discordId`]: "$discordId",
            [`${key}.discordAvatar`]: "$discordAvatar",
            [`${key}.rank`]: {
              $function: {
                body: "function() {try {row_number+= 1;} catch (e) {row_number= 1;}return row_number;}",
                args: [],
                lang: "js",
              },
            },
            [`${key}.badgeId`]: {
              $function: {
                body: "function(badges) {if (!badges) return null; for(let i=0;i<badges.length;i++){ if(badges[i].selected) return badges[i].id;}return null;}",
                args: ["$inventory.badges"],
                lang: "js",
              },
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: `$${key}`,
          },
        },
        { $out: lbCollectionName },
      ],
      { allowDiskUse: true }
    );

  await lb.toArray();
  const end1 = performance.now();

  const start2 = performance.now();
  await db.collection(lbCollectionName).createIndex({ uid: -1 });
  await db.collection(lbCollectionName).createIndex({ rank: 1 });
  leaderboardUpdating[`${language}_${mode}_${mode2}`] = false;
  const end2 = performance.now();

  //update speedStats
  const start3 = performance.now();
  const boundaries = [...Array(32).keys()].map((it) => it * 10);
  const statsKey = `${language}_${mode}_${mode2}`;
  const src = await db.collection(lbCollectionName);
  const histogram = src.aggregate(
    [
      {
        $bucket: {
          groupBy: "$wpm",
          boundaries: boundaries,
          default: "Other",
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $arrayToObject: [[{ k: { $toString: "$_id" }, v: "$count" }]],
          },
        },
      },
      {
        $group: {
          _id: "speedStatsHistogram", //we only expect one document with type=speedStats
          [`${statsKey}`]: {
            $mergeObjects: "$$ROOT",
          },
        },
      },
      {
        $merge: {
          into: "public",
          on: "_id",
          whenMatched: "merge",
          whenNotMatched: "insert",
        },
      },
    ],
    { allowDiskUse: true }
  );
  await histogram.toArray();
  const end3 = performance.now();

  const timeToRunAggregate = (end1 - start1) / 1000;
  const timeToRunIndex = (end2 - start2) / 1000;
  const timeToSaveHistogram = (end3 - start3) / 1000; // not sent to prometheus yet

  Logger.logToDb(
    `system_lb_update_${language}_${mode}_${mode2}`,
    `Aggregate ${timeToRunAggregate}s, loop 0s, insert 0s, index ${timeToRunIndex}s, histogram ${timeToSaveHistogram}`
  );

  setLeaderboard(language, mode, mode2, [
    timeToRunAggregate,
    0,
    0,
    timeToRunIndex,
  ]);

  return {
    message: "Successfully updated leaderboard",
  };
}

async function createIndex(key: string): Promise<void> {
  const index = {
    [`${key}.wpm`]: -1,
    [`${key}.acc`]: -1,
    [`${key}.timestamp`]: -1,
    [`${key}.raw`]: -1,
    [`${key}.consistency`]: -1,
    banned: 1,
    lbOptOut: 1,
    needsToChangeName: 1,
    timeTyping: 1,
    uid: 1,
    name: 1,
    discordId: 1,
    discordAvatar: 1,
    inventory: 1,
  };
  const partial = {
    partialFilterExpression: {
      [`${key}.wpm`]: {
        $gt: 0,
      },
      timeTyping: {
        $gt: isDevEnvironment() ? 0 : 7200,
      },
    },
  };
  await db.collection("users").createIndex(index, partial);
}

export async function createIndicies(): Promise<void> {
  await createIndex("lbPersonalBests.time.15.english");
  await createIndex("lbPersonalBests.time.60.english");
}
