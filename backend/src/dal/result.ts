import {
  Collection,
  type DeleteResult,
  Filter,
  ObjectId,
  type UpdateResult,
} from "mongodb";
import MonkeyError from "../utils/error";
import * as db from "../init/db";
import { getUser, getTags } from "./user";
import { DBResult, replaceLegacyValues } from "../utils/result";
import { tryCatch } from "@monkeytype/util/trycatch";

export const getResultCollection = (): Collection<DBResult> =>
  db.collection<DBResult>("results");

export async function addResult(
  uid: string,
  result: DBResult
): Promise<{ insertedId: ObjectId }> {
  const { data: user } = await tryCatch(getUser(uid, "add result"));

  if (!user) throw new MonkeyError(404, "User not found", "add result");
  if (result.uid === undefined) result.uid = uid;
  // result.ir = true;
  const res = await getResultCollection().insertOne(result);
  return {
    insertedId: res.insertedId,
  };
}

export async function deleteAll(uid: string): Promise<DeleteResult> {
  return await getResultCollection().deleteMany({ uid });
}

export async function updateTags(
  uid: string,
  resultId: string,
  tags: string[]
): Promise<UpdateResult> {
  const result = await getResultCollection().findOne({
    _id: new ObjectId(resultId),
    uid,
  });
  if (!result) throw new MonkeyError(404, "Result not found");
  const userTags = await getTags(uid);
  const userTagIds = new Set(userTags.map((tag) => tag._id.toString()));
  let validTags = true;
  tags.forEach((tagId) => {
    if (!userTagIds.has(tagId)) validTags = false;
  });
  if (!validTags) {
    throw new MonkeyError(422, "One of the tag id's is not valid");
  }
  return await getResultCollection().updateOne(
    { _id: new ObjectId(resultId), uid },
    { $set: { tags } }
  );
}

export async function getResult(uid: string, id: string): Promise<DBResult> {
  const result = await getResultCollection().findOne({
    _id: new ObjectId(id),
    uid,
  });

  if (!result) throw new MonkeyError(404, "Result not found");
  return replaceLegacyValues(result);
}

export async function getLastResult(uid: string): Promise<DBResult> {
  const lastResult = await getResultCollection().findOne(
    { uid },
    { sort: { timestamp: -1 } }
  );

  if (lastResult === null) throw new MonkeyError(404, "No last result found");
  return replaceLegacyValues(lastResult);
}

export async function getLastResultTimestamp(uid: string): Promise<number> {
  const lastResult = await getResultCollection().findOne(
    { uid },
    {
      projection: { timestamp: 1, _id: 0 },
      sort: { timestamp: -1 },
    }
  );

  if (lastResult === null) throw new MonkeyError(404, "No last result found");
  return lastResult.timestamp;
}

export async function getResultByTimestamp(
  uid: string,
  timestamp: number
): Promise<DBResult | null> {
  const result = await getResultCollection().findOne({ uid, timestamp });
  if (result === null) return null;
  return replaceLegacyValues(result);
}

type GetResultsOpts = {
  onOrAfterTimestamp?: number;
  limit?: number;
  offset?: number;
};

export async function getResults(
  uid: string,
  opts?: GetResultsOpts
): Promise<DBResult[]> {
  const { onOrAfterTimestamp, offset, limit } = opts ?? {};

  const condition: Filter<DBResult> = { uid };
  if (onOrAfterTimestamp !== undefined && !isNaN(onOrAfterTimestamp)) {
    condition.timestamp = { $gte: onOrAfterTimestamp };
  }

  let query = getResultCollection()
    .find(condition, {
      projection: {
        chartData: 0,
        keySpacingStats: 0,
        keyDurationStats: 0,
        name: 0,
      },
    })
    .sort({ timestamp: -1 });

  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.skip(offset);
  }

  const results = await query.toArray();
  if (results === undefined) throw new MonkeyError(404, "Result not found");
  return results.map(replaceLegacyValues);
}
