import MonkeyTypes, { Id } from "@monkeytype/types";
import _ from "lodash";
import { DeleteResult, ObjectId, UpdateResult } from "mongodb";
import * as db from "../init/db";
import MonkeyError from "../utils/error";
import { getTags, getUser } from "./user";

export async function addResult(
  uid: string,
  result: Id<MonkeyTypes.GenericResult>
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
    .collection<MonkeyTypes.GenericResult>("results")
    .insertOne(result);
  return {
    insertedId: res.insertedId,
  };
}

export async function deleteAll(uid: string): Promise<DeleteResult> {
  return await db
    .collection<MonkeyTypes.GenericResult>("results")
    .deleteMany({ uid });
}

export async function updateTags(
  uid: string,
  resultId: string,
  tags: string[]
): Promise<UpdateResult> {
  const result = await db
    .collection<MonkeyTypes.GenericResult>("results")
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
    .collection<MonkeyTypes.GenericResult>("results")
    .updateOne({ _id: new ObjectId(resultId), uid }, { $set: { tags } });
}

export async function getResult(
  uid: string,
  id: string
): Promise<MonkeyTypes.GenericResult> {
  const result = await db
    .collection<MonkeyTypes.GenericResult>("results")
    .findOne({ _id: new ObjectId(id), uid });
  if (!result) throw new MonkeyError(404, "Result not found");
  return result;
}

export async function getLastResult(
  uid: string
): Promise<Partial<MonkeyTypes.GenericResult>> {
  const [lastResult] = await db
    .collection<MonkeyTypes.GenericResult>("results")
    .find({ uid })
    .sort({ timestamp: -1 })
    .limit(1)
    .toArray();
  if (!lastResult) throw new MonkeyError(404, "No results found");
  return _.omit(lastResult, "uid");
}

export async function getResultByTimestamp(
  uid: string,
  timestamp
): Promise<MonkeyTypes.GenericResult | null> {
  return await db
    .collection<MonkeyTypes.GenericResult>("results")
    .findOne({ uid, timestamp });
}

export async function getResults(
  uid: string,
  start?: number,
  end?: number
): Promise<MonkeyTypes.GenericResult[]> {
  start = start ?? 0;
  end = end ?? 1000;
  const results = await db
    .collection<MonkeyTypes.GenericResult>("results")
    .find({ uid })
    .sort({ timestamp: -1 })
    .skip(start)
    .limit(end)
    .toArray(); // this needs to be changed to later take patreon into consideration
  if (!results) throw new MonkeyError(404, "Result not found");
  return results;
}
