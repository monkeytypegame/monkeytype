import { DeleteResult, ObjectId, UpdateResult } from "mongodb";
import MonkeyError from "../utils/error";
import * as db from "../init/db";
import { getUser, getTags } from "./user";

export async function addResult(uid: string, result: MonkeyTypes.DBResult): Promise<{ insertedId: ObjectId }> {
  const user = await getUser(uid, "add result").catch(() => null);
  if (!user) throw new MonkeyError(404, "User not found", "add result");
  result.uid = result.uid ?? uid;
  const res = await db.collection<MonkeyTypes.DBResult>("results").insertOne(result);
  return { insertedId: res.insertedId };
}

export const deleteAll = (uid: string): Promise<DeleteResult> => db.collection<MonkeyTypes.DBResult>("results").deleteMany({ uid });

export async function updateTags(uid: string, resultId: string, tags: string[]): Promise<UpdateResult> {
  const result = await db.collection<MonkeyTypes.DBResult>("results").findOne({ _id: new ObjectId(resultId), uid });
  if (!result) throw new MonkeyError(404, "Result not found");
  const userTagIds = (await getTags(uid)).map((tag) => tag._id.toString());
  if (!tags.every(tagId => userTagIds.includes(tagId))) throw new MonkeyError(422, "One of the tag id's is not valid");
  return db.collection<MonkeyTypes.DBResult>("results").updateOne({ _id: new ObjectId(resultId), uid }, { $set: { tags } });
}

export const getResult = async (uid: string, id: string): Promise<MonkeyTypes.DBResult> => {
  const result = await db.collection<MonkeyTypes.DBResult>("results").findOne({ _id: new ObjectId(id), uid });
  if (!result) throw new MonkeyError(404, "Result not found");
  return result;
}

export const getLastResult = async (uid: string): Promise<Omit<MonkeyTypes.DBResult, "uid">> => {
  const lastResult = await db.collection<MonkeyTypes.DBResult>("results").find({ uid }).sort({ timestamp: -1 }).limit(1).toArray();
  if (!lastResult.length) throw new MonkeyError(404, "No results found");
  return _.omit(lastResult[0], "uid");
}

export const getResultByTimestamp = (uid: string, timestamp): Promise<MonkeyTypes.DBResult | null> => db.collection<MonkeyTypes.DBResult>("results").findOne({ uid, timestamp });

export async function getResults(uid: string, opts?: GetResultsOpts): Promise<MonkeyTypes.DBResult[]> {
  const { onOrAfterTimestamp, offset, limit } = opts ?? {};
  let query = db.collection<MonkeyTypes.DBResult>("results").find({ uid, ...(onOrAfterTimestamp && { timestamp: { $gte: onOrAfterTimestamp } }) }).sort({ timestamp: -1 });
  if (limit) query = query.limit(limit);
  if (offset) query = query.skip(offset);
  const results = await query.toArray();
  if (!results.length) throw new MonkeyError(404, "Result not found");
  return results;
}
