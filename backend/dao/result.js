const { ObjectID } = require("mongodb");
const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
const UserDAO = require("./user");

class ResultDAO {
  static async addResult(uid, result) {
    let user;
    try {
      user = await UserDAO.getUser(uid);
    } catch (e) {
      user = null;
    }
    if (!user) throw new MonkeyError(404, "User not found", "add result");
    if (result.uid === undefined) result.uid = uid;
    let res = await mongoDB().collection("results").insertOne(result);
    return {
      insertedId: res.insertedId,
    };
  }

  static async deleteAll(uid) {
    return await mongoDB().collection("results").deleteMany({ uid });
  }

  static async updateTags(uid, resultid, tags) {
    const result = await mongoDB()
      .collection("results")
      .findOne({ _id: ObjectID(resultid), uid });
    if (!result) throw new MonkeyError(404, "Result not found");
    const userTags = await UserDAO.getTags(uid);
    const userTagIds = userTags.map((tag) => tag._id.toString());
    let validTags = true;
    tags.forEach((tagId) => {
      if (!userTagIds.includes(tagId)) validTags = false;
    });
    if (!validTags)
      throw new MonkeyError(400, "One of the tag id's is not vaild");
    return await mongoDB()
      .collection("results")
      .updateOne({ _id: ObjectID(resultid), uid }, { $set: { tags } });
  }

  static async getResult(uid, id) {
    const result = await mongoDB().collection("results").findOne({ id, uid });
    if (!result) throw new MonkeyError(404, "Result not found");
    return result;
  }

  static async getResultByTimestamp(uid, timestamp) {
    return await mongoDB().collection("results").findOne({ uid, timestamp });
  }

  static async getResults(uid, start, end) {
    start = start ?? 0;
    end = end ?? 1000;
    const result = await mongoDB()
      .collection("results")
      .find({ uid })
      .sort({ timestamp: -1 })
      .skip(start)
      .limit(end)
      .toArray(); // this needs to be changed to later take patreon into consideration
    if (!result) throw new MonkeyError(404, "Result not found");
    return result;
  }

  static async getLeaderboard(type, mode, mode2) {
    let count;
    let startDate = new Date();
    let start = 0;
    if (type == "global") count = 999;
    else if (type == "daily") {
      count = 100;
      startDate.setUTCHours(0, 0, 0, 0); // next midnight UTC
      start = startDate.getTime();
    }
    const leaders = await mongoDB()
      .collection("results")
      .aggregate([
        {
          $match: {
            mode: mode,
            mode2: parseInt(mode2),
            timestamp: { $gt: start },
          },
        },
        { $sort: { wpm: -1 } },
        {
          $group: {
            _id: "$name",
            doc: { $first: "$$ROOT" },
          },
        },
        {
          $replaceRoot: {
            newRoot: "$doc",
          },
        },
        { $limit: count },
      ])
      .toArray();
    let board = [];
    leaders.forEach((entry) => {
      board.push({
        name: entry.name,
        wpm: entry.wpm,
        acc: entry.acc,
        raw: entry.rawWpm,
        consistency: entry.consistency,
        mode: entry.mode,
        mode2: entry.mode2,
        timestamp: entry.timestamp,
      });
    });
    board.sort((a, b) => {
      return b.wpm - a.wpm;
    });
    let leaderboard = {
      type: type,
      size: board.length,
      board: board,
    };
    if (type == "daily") {
      var d = new Date();
      d.setUTCHours(24, 0, 0, 0); // next midnight UTC
      leaderboard.resetTime = d;
    }
    return leaderboard;
  }

  static async checkLeaderboardQualification(uid, result) {
    function processLb(user, lb, result) {
      let board = lb.board;
      let data = {};
      data.foundAt = board.indexOf(
        board.find((entry) => entry.name === user.name)
      );
      let maxSize = 100;
      if (lb.type === "global") maxSize = 999;
      if (
        result.wpm < board[board.length - 1].wpm &&
        board.length === maxSize
      ) {
        data.insertedAt = -1;
      } else {
        for (let i = board.length - 1; i > 0; i--) {
          if (result.wpm < board[i].wpm) {
            data.insertedAt = i + 1;
            break;
          }
        }
        if (data.insertedAt === undefined) data.insertedAt = 0;
      }
      return data;
    }

    const user = await mongoDB().collection("users").findOne({ uid: uid });
    //might need to check if email is verified with firebase
    if (user.emailVerified === false) return { needsToVerifyEmail: true };
    if (user.name === undefined) return { noName: true };
    if (user.banned) return { banned: true };
    const globalLb = await this.getLeaderboard(
      "global",
      result.mode,
      result.mode2
    );
    const dailyLb = await this.getLeaderboard(
      "daily",
      result.mode,
      result.mode2
    );
    const globalData = processLb(user, globalLb, result);
    const dailyData = processLb(user, dailyLb, result);
    return { global: globalData, daily: dailyData };
  }
}

module.exports = ResultDAO;
