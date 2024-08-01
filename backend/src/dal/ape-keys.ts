import _ from "lodash";
import * as db from "../init/db";
import {
  type Filter,
  type MatchKeysAndValues,
  type WithId,
  ObjectId,
  Collection,
} from "mongodb";
import MonkeyError from "../utils/error";

export const getApeKeysCollection = (): Collection<
  WithId<MonkeyTypes.ApeKeyDB>
> => db.collection<MonkeyTypes.ApeKeyDB>("ape-keys");

function getApeKeyFilter(
  uid: string,
  keyId: string
): Filter<MonkeyTypes.ApeKeyDB> {
  return {
    _id: new ObjectId(keyId),
    uid,
  };
}

export async function getApeKeys(uid: string): Promise<MonkeyTypes.ApeKeyDB[]> {
  return await getApeKeysCollection().find({ uid }).toArray();
}

export async function getApeKey(
  keyId: string
): Promise<MonkeyTypes.ApeKeyDB | null> {
  return await getApeKeysCollection().findOne({ _id: new ObjectId(keyId) });
}

export async function countApeKeysForUser(uid: string): Promise<number> {
  return getApeKeysCollection().countDocuments({ uid });
}

export async function addApeKey(apeKey: MonkeyTypes.ApeKeyDB): Promise<string> {
  const insertionResult = await getApeKeysCollection().insertOne(apeKey);
  return insertionResult.insertedId.toHexString();
}

async function updateApeKey(
  uid: string,
  keyId: string,
  updates: MatchKeysAndValues<MonkeyTypes.ApeKeyDB>
): Promise<void> {
  const updateResult = await getApeKeysCollection().updateOne(
    getApeKeyFilter(uid, keyId),
    {
      $inc: { useCount: _.has(updates, "lastUsedOn") ? 1 : 0 },
      $set: _.pickBy(updates, (value) => !_.isNil(value)),
    }
  );

  if (updateResult.modifiedCount === 0) {
    throw new MonkeyError(404, "ApeKey not found");
  }
}

export async function editApeKey(
  uid: string,
  keyId: string,
  name?: string,
  enabled?: boolean
): Promise<void> {
  //check if there is a change
  if (name === undefined && enabled === undefined) return;
  const apeKeyUpdates = {
    name,
    enabled,
    modifiedOn: Date.now(),
  };

  await updateApeKey(uid, keyId, apeKeyUpdates);
}

export async function updateLastUsedOn(
  uid: string,
  keyId: string
): Promise<void> {
  const apeKeyUpdates = {
    lastUsedOn: Date.now(),
  };

  await updateApeKey(uid, keyId, apeKeyUpdates);
}

export async function deleteApeKey(uid: string, keyId: string): Promise<void> {
  const deletionResult = await getApeKeysCollection().deleteOne(
    getApeKeyFilter(uid, keyId)
  );

  if (deletionResult.deletedCount === 0) {
    throw new MonkeyError(404, "ApeKey not found");
  }
}

export async function deleteAllApeKeys(uid: string): Promise<void> {
  await getApeKeysCollection().deleteMany({ uid });
}
