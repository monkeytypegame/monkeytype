const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
const { ObjectID } = require("mongodb");

class LeaderboardsDAO {
  static async get(mode, mode2, language) {
    const preset = await mongoDB()
      .collection(`leaderboards.${language}.${mode}.${mode2}`)
      .find()
      .toArray();
    return preset;
  }

  static async getRank(mode, mode2, language, uid) {
    const res = await mongoDB()
      .collection(`leaderboards.${language}.${mode}.${mode2}`)
      .findOne({ uid });
    return res.rank;
  }

  static async update(mode, mode2, language, uid = undefined) {
    let str = `lbPersonalBests.${mode}.${mode2}.${language}`;
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

    let rerval = undefined;
    lb.forEach((lbEntry, index) => {
      lbEntry.rank = index + 1;
      if (uid && lbEntry.uid === uid) {
        rerval = index + 1;
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

    if (rerval) {
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
