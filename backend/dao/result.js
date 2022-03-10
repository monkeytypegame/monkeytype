import { ObjectId } from "mongodb";
import MonkeyError from "../utils/error";
import db from "../init/db";

import UserDAO from "./user";

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
    // result.ir = true;
    let res = await db.collection("results").insertOne(result);
    return {
      insertedId: res.insertedId,
    };
  }

  static async deleteAll(uid) {
    return await db.collection("results").deleteMany({ uid });
  }

  static async updateTags(uid, resultid, tags) {
    const result = await db
      .collection("results")
      .findOne({ _id: new ObjectId(resultid), uid });
    if (!result) throw new MonkeyError(404, "Result not found");
    const userTags = await UserDAO.getTags(uid);
    const userTagIds = userTags.map((tag) => tag._id.toString());
    let validTags = true;
    tags.forEach((tagId) => {
      if (!userTagIds.includes(tagId)) validTags = false;
    });
    if (!validTags) {
      throw new MonkeyError(422, "One of the tag id's is not valid");
    }
    return await db
      .collection("results")
      .updateOne({ _id: new ObjectId(resultid), uid }, { $set: { tags } });
  }

  static async getResult(uid, id) {
    const result = await db
      .collection("results")
      .findOne({ _id: new ObjectId(id), uid });
    if (!result) throw new MonkeyError(404, "Result not found");
    return result;
  }

  static async getLastResult(uid) {
    const [lastResult] = await db
      .collection("results")
      .find({ uid })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();
    if (!lastResult) throw new MonkeyError(404, "No results found");
    return lastResult;
  }

  static async getResultByTimestamp(uid, timestamp) {
    return await db.collection("results").findOne({ uid, timestamp });
  }

  static async getResults(uid, start, end) {
    start = start ?? 0;
    end = end ?? 1000;
    const result = await db
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

export default ResultDAO;
