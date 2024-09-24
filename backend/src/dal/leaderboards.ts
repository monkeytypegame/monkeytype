import * as db from "../init/db";
import Logger from "../utils/logger";
import { performance } from "perf_hooks";
import { setLeaderboard } from "../utils/prometheus";
import { isDevEnvironment } from "../utils/misc";
import { getCachedConfiguration } from "../init/configuration";

import { addLog } from "./logs";
import { Collection, ObjectId } from "mongodb";
import {
  LeaderboardEntry,
  LeaderboardRank,
} from "@monkeytype/contracts/schemas/leaderboards";
import { omit } from "lodash";
import { DBUser } from "./user";

export type DBLeaderboardEntry = LeaderboardEntry & {
  _id: ObjectId;
};

export const getCollection = (key: {
  language: string;
  mode: string;
  mode2: string;
}): Collection<DBLeaderboardEntry> =>
  db.collection<DBLeaderboardEntry>(
    `leaderboards.${key.language}.${key.mode}.${key.mode2}`
  );

export async function get(
  mode: string,
  mode2: string,
  language: string,
  skip: number,
  limit = 50
): Promise<DBLeaderboardEntry[] | false> {
  //if (leaderboardUpdating[`${language}_${mode}_${mode2}`]) return false;

  if (limit > 50 || limit <= 0) limit = 50;
  if (skip < 0) skip = 0;
  try {
    const preset = await getCollection({ language, mode, mode2 })
      .find()
      .sort({ rank: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const premiumFeaturesEnabled = (await getCachedConfiguration(true)).users
      .premium.enabled;

    if (!premiumFeaturesEnabled) {
      return preset.map((it) => omit(it, "isPremium"));
    }

    return preset;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (e.error === 175) {
      //QueryPlanKilled, collection was removed during the query
      return false;
    }
    throw e;
  }
}

export async function getRank(
  mode: string,
  mode2: string,
  language: string,
  uid: string
): Promise<LeaderboardRank | false> {
  try {
    const entry = await getCollection({ language, mode, mode2 }).findOne({
      uid,
    });
    const count = await getCollection({
      language,
      mode,
      mode2,
    }).estimatedDocumentCount();

    return {
      count,
      rank: entry?.rank,
      entry: entry !== null ? entry : undefined,
    };
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (e.error === 175) {
      //QueryPlanKilled, collection was removed during the query
      return false;
    }
    throw e;
  }
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
  const lb = db.collection<DBUser>("users").aggregate<LeaderboardEntry>(
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
          premium: 1,
        },
      },

      {
        $addFields: {
          "user.uid": "$uid",
          "user.name": "$name",
          "user.discordId": { $ifNull: ["$discordId", "$$REMOVE"] },
          "user.discordAvatar": { $ifNull: ["$discordAvatar", "$$REMOVE"] },
          [`${key}.consistency`]: {
            $ifNull: [`$${key}.consistency`, "$$REMOVE"],
          },
          calculated: {
            $function: {
              lang: "js",
              args: [
                "$premium.expirationTimestamp",
                "$$NOW",
                "$inventory.badges",
              ],
              body: `function(expiration, currentTime, badges) { 
                        try {row_number+= 1;} catch (e) {row_number= 1;} 
                        var badgeId = undefined;
                        if(badges)for(let i=0; i<badges.length; i++){
                            if(badges[i].selected){ badgeId = badges[i].id; break}
                        }
                        var isPremium = expiration !== undefined && (expiration === -1 || new Date(expiration)>currentTime) || undefined;
                        return {rank:row_number,badgeId, isPremium};
                      }`,
            },
          },
        },
      },
      {
        $replaceWith: {
          $mergeObjects: [`$${key}`, "$user", "$calculated"],
        },
      },
      { $out: lbCollectionName },
    ],
    { allowDiskUse: true }
  );

  const start1 = performance.now();
  await lb.toArray();
  const end1 = performance.now();

  const start2 = performance.now();
  await db.collection(lbCollectionName).createIndex({ uid: -1 });
  await db.collection(lbCollectionName).createIndex({ rank: 1 });
  const end2 = performance.now();

  //update speedStats
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
  const start3 = performance.now();
  await histogram.toArray();
  const end3 = performance.now();

  const timeToRunAggregate = (end1 - start1) / 1000;
  const timeToRunIndex = (end2 - start2) / 1000;
  const timeToSaveHistogram = (end3 - start3) / 1000; // not sent to prometheus yet

  void addLog(
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
    premium: 1,
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

  if (isDevEnvironment()) {
    Logger.info("Updating leaderboards in dev mode...");
    await update("time", "15", "english");
    await update("time", "60", "english");
  }
}
