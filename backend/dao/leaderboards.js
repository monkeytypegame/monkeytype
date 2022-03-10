import db from "../init/db";
import Logger from "../utils/logger";
import { performance } from "perf_hooks";

const leaderboardUpdating = {};

class LeaderboardsDAO {
  static async get(mode, mode2, language, skip, limit = 50) {
    if (leaderboardUpdating[`${language}_${mode}_${mode2}`]) return false;
    if (limit > 50 || limit <= 0) limit = 50;
    if (skip < 0) skip = 0;
    const preset = await db
      .collection(`leaderboards.${language}.${mode}.${mode2}`)
      .find()
      .sort({ rank: 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit.toString()))
      .toArray();
    return preset;
  }

  static async getRank(mode, mode2, language, uid) {
    const res = await db
      .collection(`leaderboards.${language}.${mode}.${mode2}`)
      .findOne({ uid });
    if (res) {
      res.count = await db
        .collection(`leaderboards.${language}.${mode}.${mode2}`)
        .estimatedDocumentCount();
    }
    return res;
  }

  static async update(mode, mode2, language, uid = undefined) {
    let str = `lbPersonalBests.${mode}.${mode2}.${language}`;
    let start1 = performance.now();
    let lb = await db
      .collection("users")
      .aggregate(
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
    let end1 = performance.now();

    let start2 = performance.now();
    let retval = undefined;
    lb.forEach((lbEntry, index) => {
      lbEntry.rank = index + 1;
      if (uid && lbEntry.uid === uid) {
        retval = index + 1;
      }
    });
    let end2 = performance.now();
    let start3 = performance.now();
    leaderboardUpdating[`${language}_${mode}_${mode2}`] = true;
    try {
      await db.collection(`leaderboards.${language}.${mode}.${mode2}`).drop();
    } catch (e) {}
    if (lb && lb.length !== 0) {
      await db
        .collection(`leaderboards.${language}.${mode}.${mode2}`)
        .insertMany(lb);
    }
    let end3 = performance.now();

    let start4 = performance.now();
    await db
      .collection(`leaderboards.${language}.${mode}.${mode2}`)
      .createIndex({
        uid: -1,
      });
    await db
      .collection(`leaderboards.${language}.${mode}.${mode2}`)
      .createIndex({
        rank: 1,
      });
    leaderboardUpdating[`${language}_${mode}_${mode2}`] = false;
    let end4 = performance.now();

    let timeToRunAggregate = (end1 - start1) / 1000;
    let timeToRunLoop = (end2 - start2) / 1000;
    let timeToRunInsert = (end3 - start3) / 1000;
    let timeToRunIndex = (end4 - start4) / 1000;

    Logger.log(
      `system_lb_update_${language}_${mode}_${mode2}`,
      `Aggregate ${timeToRunAggregate}s, loop ${timeToRunLoop}s, insert ${timeToRunInsert}s, index ${timeToRunIndex}s`,
      uid
    );

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
}

export default LeaderboardsDAO;
