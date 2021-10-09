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
    result.ir = true;
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
    const result = await mongoDB()
      .collection("results")
      .findOne({ _id: ObjectID(id), uid });
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
}

module.exports = ResultDAO;
