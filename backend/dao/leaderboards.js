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
    let str = `personalBests.${mode}.${mode2}`;
    let lb = await mongoDB()
      .collection("users")
      .aggregate([
        {
          $unset: [
            "_id",
            "addedAt",
            "email",
            "oldTypingStats",
            "tags",
            "bananas",
            "discordId",
            "timeTyping",
            "startedTests",
            "completedTests",
          ],
        },
        {
          $match: {
            banned: {
              $exists: false,
            },
            [str]: {
              $elemMatch: {
                language: "english",
                difficulty: "normal",
                timestamp: {
                  $exists: true,
                },
              },
            },
          },
        },
        {
          $replaceWith: {
            name: "$name",
            uid: "$uid",
            result: "$" + str,
          },
        },
        {
          $unwind: {
            path: "$result",
          },
        },
        {
          $match: {
            "result.language": language,
            "result.difficulty": "normal",
            "result.punctuation": false,
          },
        },
        {
          $set: {
            "result.name": "$name",
            "result.uid": "$uid",
          },
        },
        {
          $replaceRoot: {
            newRoot: "$result",
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
