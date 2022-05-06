import * as db from "../init/db";
import Logger from "../utils/logger";
import { performance } from "perf_hooks";
import { setLeaderboard } from "../utils/prometheus";

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

interface RankReturn extends MonkeyTypes.LeaderboardEntry {
  count?: number;
}

export async function getRank(
  mode: string,
  mode2: string,
  language: string,
  uid: string
): Promise<RankReturn | false | void> {
  if (leaderboardUpdating[`${language}_${mode}_${mode2}`]) return false;
  const res: RankReturn | null = await db
    .collection<MonkeyTypes.LeaderboardEntry>(
      `leaderboards.${language}.${mode}.${mode2}`
    )
    .findOne({ uid });
  if (res) {
    res.count = await db
      .collection(`leaderboards.${language}.${mode}.${mode2}`)
      .estimatedDocumentCount();
    return res;
  }
}

export async function update(
  mode: string,
  mode2: string,
  language: string,
  uid?: string
): Promise<{
  message: string;
  rank?: number;
}> {
  const str = `lbPersonalBests.${mode}.${mode2}.${language}`;
  const start1 = performance.now();
  const lb = await db
    .collection<MonkeyTypes.LeaderboardEntry>("users")
    .aggregate<MonkeyTypes.LeaderboardEntry>(
      [
        {
          $match: {
            [str + ".wpm"]: {
              $exists: true,
            },
            [str + ".acc"]: {
              $exists: true,
            },
            [str + ".timestamp"]: {
              $exists: true,
            },
            banned: { $exists: false },
          },
        },
        {
          $set: {
            [str + ".uid"]: "$uid",
            [str + ".name"]: "$name",
            [str + ".discordId"]: "$discordId",
          },
        },
        {
          $replaceRoot: {
            newRoot: "$" + str,
          },
        },
        {
          $sort: {
            wpm: -1,
            acc: -1,
            timestamp: -1,
          },
        },
      ],
      { allowDiskUse: true }
    )
    .toArray();
  const end1 = performance.now();

  const start2 = performance.now();
  let retval: number | undefined = undefined;
  lb.forEach((lbEntry, index) => {
    lbEntry.rank = index + 1;
    if (uid && lbEntry.uid === uid) {
      retval = index + 1;
    }
  });
  const end2 = performance.now();
  const start3 = performance.now();
  leaderboardUpdating[`${language}_${mode}_${mode2}`] = true;
  try {
    await db.collection(`leaderboards.${language}.${mode}.${mode2}`).drop();
  } catch (e) {}
  if (lb && lb.length !== 0) {
    await db
      .collection<MonkeyTypes.LeaderboardEntry>(
        `leaderboards.${language}.${mode}.${mode2}`
      )
      .insertMany(lb);
  }
  const end3 = performance.now();

  const start4 = performance.now();
  await db.collection(`leaderboards.${language}.${mode}.${mode2}`).createIndex({
    uid: -1,
  });
  await db.collection(`leaderboards.${language}.${mode}.${mode2}`).createIndex({
    rank: 1,
  });
  leaderboardUpdating[`${language}_${mode}_${mode2}`] = false;
  const end4 = performance.now();

  const timeToRunAggregate = (end1 - start1) / 1000;
  const timeToRunLoop = (end2 - start2) / 1000;
  const timeToRunInsert = (end3 - start3) / 1000;
  const timeToRunIndex = (end4 - start4) / 1000;

  Logger.logToDb(
    `system_lb_update_${language}_${mode}_${mode2}`,
    `Aggregate ${timeToRunAggregate}s, loop ${timeToRunLoop}s, insert ${timeToRunInsert}s, index ${timeToRunIndex}s`,
    uid
  );

  setLeaderboard(language, mode, mode2, [
    timeToRunAggregate,
    timeToRunLoop,
    timeToRunInsert,
    timeToRunIndex,
  ]);

  if (retval) {
    return {
      message: "Successfully updated leaderboard",
      rank: retval,
    };
  } else {
    return {
      message: "Successfully updated leaderboard",
    };
  }
}
