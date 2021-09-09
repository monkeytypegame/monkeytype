const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
const { ObjectID } = require("mongodb");
const Logger = require("../handlers/logger");
const { performance } = require("perf_hooks");

class LeaderboardsDAO {
  static async get(mode, mode2, language, skip, limit = 100) {
    if (limit > 100 || limit <= 0) limit = 100;
    if (skip < 0) skip = 0;
    const preset = await mongoDB()
      .collection(`leaderboards.${language}.${mode}.${mode2}`)
      .find()
      .sort({ rank: 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();
    return preset;
  }

  static async getRank(mode, mode2, language, uid) {
    const res = await mongoDB()
      .collection(`leaderboards.${language}.${mode}.${mode2}`)
      .findOne({ uid });
    return res;
  }

  static async update(mode, mode2, language, uid = undefined) {
    let str = `lbPersonalBests.${mode}.${mode2}.${language}`;
    let start = performance.now();
    let lb = await mongoDB()
      .collection("users")
      .aggregate([
        {
          $match: {
            [str + ".wpm"]: {
              $exists: true,
            },
            [str + ".acc"]: {
              $exists: true,
            },
            banned: { $exists: false },
          },
        },
        {
          $set: {
            [str + ".uid"]: "$uid",
            [str + ".name"]: "$name",
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
      ])
      .toArray();

    let retval = undefined;
    lb.forEach((lbEntry, index) => {
      lbEntry.rank = index + 1;
      if (uid && lbEntry.uid === uid) {
        retval = index + 1;
      }
    });

    try {
      await mongoDB()
        .collection(`leaderboards.${language}.${mode}.${mode2}`)
        .drop();
    } catch (e) {}
    await mongoDB()
      .collection(`leaderboards.${language}.${mode}.${mode2}`)
      .insertMany(lb);

    let end = performance.now();
    let timeToRunSec = (end - start) / 1000;

    Logger.log(
      `lb_update_${language}_${mode}_${mode2}`,
      `Update took ${timeToRunSec} seconds`,
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

module.exports = LeaderboardsDAO;
