const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");

class ResultDAO {
  static async addResult(uid, result) {
    if (result.uid === undefined) result.uid = uid;
    return await mongoDB().collection("results").insertOne(result);
  }

  static async editResultTags(uid, id, tags) {
    const result = await mongoDB().collection("result").findOne({ id, uid });
    if (!result) throw new MonkeyError(404, "Result not found");
    return await mongoDB()
      .collection("results")
      .updateOne({ id, uid }, { $set: { tags } });
  }

  static async getResult(uid, id) {
    const result = await mongoDB().collection("result").findOne({ id, uid });
    if (!result) throw new MonkeyError(404, "Result not found");
    return result;
  }

  static async getResults(uid, start, end) {
    start = start ?? 0;
    end = end ?? 1000;
    const result = await mongoDB()
      .collection("result")
      .find({ id, uid })
      .sort({ timestamp })
      .skip(start)
      .limit(end); // this needs to be changed to later take patreon into consideration
    if (!result) throw new MonkeyError(404, "Result not found");
    return result;
  }
}

module.exports = ResultDAO;
