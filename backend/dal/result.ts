import { DeleteResult, ObjectId, UpdateResult } from "mongodb";
import MonkeyError from "../utils/error";
import * as db from "../init/db";

import { getUser, getTags } from "./user";

type MonkeyTypesResult = MonkeyTypes.Result<MonkeyTypes.Mode>;

export async function addResult(
  uid: string,
  result: MonkeyTypesResult
): Promise<{ insertedId: ObjectId }> {
  let user;
  try {
    user = await getUser(uid, "add result");
  } catch (e) {
    user = null;
  }
  if (!user) throw new MonkeyError(404, "User not found", "add result");
  if (result.uid === undefined) result.uid = uid;
  // result.ir = true;
  const res = await db
    .collection<MonkeyTypesResult>("results")
    .insertOne(result);
  return {
    insertedId: res.insertedId,
  };
}

export async function deleteAll(uid: string): Promise<DeleteResult> {
  return await db.collection<MonkeyTypesResult>("results").deleteMany({ uid });
}

export async function updateTags(
  uid: string,
  resultId: string,
  tags: string[]
): Promise<UpdateResult> {
  const result = await db
    .collection<MonkeyTypesResult>("results")
    .findOne({ _id: new ObjectId(resultId), uid });
  if (!result) throw new MonkeyError(404, "Result not found");
  const userTags = await getTags(uid);
  const userTagIds = userTags.map((tag) => tag._id.toString());
  let validTags = true;
  tags.forEach((tagId) => {
    if (!userTagIds.includes(tagId)) validTags = false;
  });
  if (!validTags) {
    throw new MonkeyError(422, "One of the tag id's is not valid");
  }
  return await db
    .collection<MonkeyTypesResult>("results")
    .updateOne({ _id: new ObjectId(resultId), uid }, { $set: { tags } });
}

export async function getResult(
  uid: string,
  id: string
): Promise<MonkeyTypesResult> {
  const result = await db
    .collection<MonkeyTypesResult>("results")
    .findOne({ _id: new ObjectId(id), uid });
  if (!result) throw new MonkeyError(404, "Result not found");
  return result;
}

export async function getLastResult(uid: string): Promise<MonkeyTypesResult> {
  const [lastResult] = await db
    .collection<MonkeyTypesResult>("results")
    .find({ uid })
    .sort({ timestamp: -1 })
    .limit(1)
    .toArray();
  if (!lastResult) throw new MonkeyError(404, "No results found");
  return lastResult;
}

export async function getResultByTimestamp(
  uid: string,
  timestamp
): Promise<MonkeyTypesResult | null> {
  return await db
    .collection<MonkeyTypesResult>("results")
    .findOne({ uid, timestamp });
}

export async function getResults(
  uid: string,
  start?: number,
  end?: number
): Promise<MonkeyTypesResult[]> {
  start = start ?? 0;
  end = end ?? 1000;
  const results = await db
    .collection<MonkeyTypesResult>("results")
    .find({ uid })
    .sort({ timestamp: -1 })
    .skip(start)
    .limit(end)
    .toArray(); // this needs to be changed to later take patreon into consideration
  if (!results) throw new MonkeyError(404, "Result not found");
  return results;
}
