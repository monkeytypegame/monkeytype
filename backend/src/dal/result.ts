import _ from "lodash";
import {
  Collection,
  type DeleteResult,
  ObjectId,
  type UpdateResult,
} from "mongodb";
import MonkeyError from "../utils/error";
import * as db from "../init/db";

import { getUser, getTags } from "./user";
import { DBResult } from "../utils/result";
import { FunboxName } from "@monkeytype/contracts/schemas/configs";
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
  return convert(result);
}

export async function getLastResult(uid: string): Promise<DBResult> {
  const [lastResult] = await getResultCollection()
    .find({ uid })
    .sort({ timestamp: -1 })
    .limit(1)
    .toArray();
  if (!lastResult) throw new MonkeyError(404, "No results found");
  return convert(lastResult);
}

export async function getResultByTimestamp(
  uid: string,
  timestamp: number
): Promise<DBResult | null> {
  const result = await getResultCollection().findOne({ uid, timestamp });
  return convert(result);
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
  let query = getResultCollection()
    .find(
      {
        uid,
        ...(!_.isNil(onOrAfterTimestamp) &&
          !_.isNaN(onOrAfterTimestamp) && {
            timestamp: { $gte: onOrAfterTimestamp },
          }),
      },
      {
        projection: {
          chartData: 0,
          keySpacingStats: 0,
          keyDurationStats: 0,
          name: 0,
        },
      }
    )
    .sort({ timestamp: -1 });

  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.skip(offset);
  }

  const results = await query.toArray();
  if (results === undefined) throw new MonkeyError(404, "Result not found");
  return convert(results);
}

function convert<T extends DBResult | DBResult[] | null>(results: T): T {
  if (results === null) return results;

  const migrate = (result: DBResult): DBResult => {
    if (typeof result.funbox === "string") {
      if (result.funbox === "none") {
        result.funbox = [];
      } else {
        result.funbox = (result.funbox as string).split("#") as FunboxName[];
      }
    }
    return result;
  };

  if (Array.isArray(results)) {
    return results.map(migrate) as T;
  } else {
    return migrate(results) as T;
  }
}
