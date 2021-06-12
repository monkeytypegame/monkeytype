const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
const UserDAO = require("./user");

class ResultDAO {
  static async addResult(uid, result) {
    let user;
    try{
      user = await UserDAO.getUser(uid);
    }catch(e){
      user = null;
    }
    if (!user) throw new MonkeyError(404, "User not found");
    if (result.uid === undefined) result.uid = uid;
    return await mongoDB().collection("results").insertOne(result);
  }

  static async editResultTags(uid, id, tags) {
    const result = await mongoDB().collection("result").findOne({ id, uid });
    if (!result) throw new MonkeyError(404, "Result not found");
    const userTags = await UserDAO.getTags(uid);
    let validTags = true;
    tags.forEach(tagId => {
      if(!userTags.includes(tagId)) validTags = false;
    });
    if (!validTags) throw new MonkeyError(400, "One of the tag id's is not vaild");
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
      .find({ uid })
      .sort({ timestamp: -1 })
      .skip(start)
      .limit(end); // this needs to be changed to later take patreon into consideration
    if (!result) throw new MonkeyError(404, "Result not found");
    return result;
  }
}

module.exports = ResultDAO;
