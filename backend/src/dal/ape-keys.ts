import _ from "lodash";
import * as db from "../init/db";
import { Filter, ObjectId, MatchKeysAndValues, Collection, WithId } from "mongodb";
import MonkeyError from "../utils/error";

const getApeKeysCollection = (): Collection<WithId<MonkeyTypes.ApeKeyDB>> => db.collection<MonkeyTypes.ApeKeyDB>("ape-keys");
const getApeKeyFilter = (uid: string, keyId: string): Filter<MonkeyTypes.ApeKeyDB> => ({ _id: new ObjectId(keyId), uid });

export async function getApeKeys(uid: string): Promise<MonkeyTypes.ApeKeyDB[]> {
  return await getApeKeysCollection().find({ uid }).toArray();
}

export async function getApeKey(keyId: string): Promise<MonkeyTypes.ApeKeyDB | null> {
  return await getApeKeysCollection().findOne({ _id: new ObjectId(keyId) });
}

export async function countApeKeysForUser(uid: string): Promise<number> {
  return _.size(await getApeKeys(uid));
}

export async function addApeKey(apeKey: MonkeyTypes.ApeKeyDB): Promise<string> {
  return (await getApeKeysCollection().insertOne(apeKey)).insertedId.toHexString();
}

async function updateApeKey(uid: string, keyId: string, updates: MatchKeysAndValues<MonkeyTypes.ApeKeyDB>): Promise<void> {
  const updateResult = await getApeKeysCollection().updateOne(getApeKeyFilter(uid, keyId), {
    $inc: { useCount: _.has(updates, "lastUsedOn") ? 1 : 0 },
    $set: _.pickBy(updates, _.negate(_.isNil)),
  });

  if (!updateResult.modifiedCount) throw new MonkeyError(404, "ApeKey not found");
}

export async function editApeKey(uid: string, keyId: string, name: string, enabled: boolean): Promise<void> {
  await updateApeKey(uid, keyId, { name, enabled, modifiedOn: Date.now() });
}

export async function updateLastUsedOn(uid: string, keyId: string): Promise<void> {
  await updateApeKey(uid, keyId, { lastUsedOn: Date.now() });
}

export async function deleteApeKey(uid: string, keyId: string): Promise<void> {
  const deletionResult = await getApeKeysCollection().deleteOne(getApeKeyFilter(uid, keyId));
  if (!deletionResult.deletedCount) throw new MonkeyError(404, "ApeKey not found");
}

export async function deleteAllApeKeys(uid: string): Promise<void> {
  await getApeKeysCollection().deleteMany({ uid });
}
