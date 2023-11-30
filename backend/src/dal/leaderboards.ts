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
  language: string,
  uid?: string
): Promise<{
  message: string;
  rank?: number;
}> {
  const key = `lbPersonalBests.${mode}.${mode2}.${language}`;
  const start1 = performance.now();
  const lb = await db
    .collection<MonkeyTypes.User>("users")
    .aggregate<MonkeyTypes.LeaderboardEntry>(
      [
        {
          $project: {
            _id: 0,
            [`${key}.wpm`]: 1,
            [`${key}.acc`]: 1,
            [`${key}.raw`]: 1,
            [`${key}.consistency`]: 1,
            [`${key}.timestamp`]: 1,
            banned: 1,
            lbOptOut: 1,
            needsToChangeName: 1,
            timeTyping: 1,
            uid: 1,
            name: 1,
            discordId: 1,
            discordAvatar: 1,
            inventory: 1,
          },
        },
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
          $set: {
            [`${key}.uid`]: "$uid",
            [`${key}.name`]: "$name",
            [`${key}.discordId`]: "$discordId",
            [`${key}.discordAvatar`]: "$discordAvatar",
            [`${key}.badges`]: "$inventory.badges",
          },
        },
        {
          $replaceRoot: {
            newRoot: `$${key}`,
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

    // extract selected badge
    if (lbEntry.badges) {
      const selectedBadge = lbEntry.badges.find((badge) => badge.selected);
      if (selectedBadge) {
        lbEntry.badgeId = selectedBadge.id;
      }
      delete lbEntry.badges;
    }
  });
  const end2 = performance.now();
  const start3 = performance.now();
  leaderboardUpdating[`${language}_${mode}_${mode2}`] = true;
  try {
    await db.collection(`leaderboards.${language}.${mode}.${mode2}`).drop();
  } catch {
    //
  }
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

  const start5 = performance.now();
  const buckets = {}; // { "70": count, "80": count }
  for (const lbEntry of lb) {
    const bucket = Math.floor(lbEntry.wpm / 10).toString() + "0";
    if (bucket in buckets) buckets[bucket]++;
    else buckets[bucket] = 1;
  }
  await db
    .collection("public")
    .updateOne(
      { type: "speedStats" },
      { $set: { [`${language}_${mode}_${mode2}`]: buckets } },
      { upsert: true }
    );
  const end5 = performance.now();

  const timeToRunAggregate = (end1 - start1) / 1000;
  const timeToRunLoop = (end2 - start2) / 1000;
  const timeToRunInsert = (end3 - start3) / 1000;
  const timeToRunIndex = (end4 - start4) / 1000;
  const timeToSaveHistogram = (end5 - start5) / 1000; // not sent to prometheus yet

  Logger.logToDb(
    `system_lb_update_${language}_${mode}_${mode2}`,
    `Aggregate ${timeToRunAggregate}s, loop ${timeToRunLoop}s, insert ${timeToRunInsert}s, index ${timeToRunIndex}s, histogram ${timeToSaveHistogram}`,
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
