import { ObjectId } from "mongodb";
import * as ConnectionsDal from "../../src/dal/connections";

export async function createConnection(
  data: Partial<ConnectionsDal.DBConnection>,
  maxPerUser = 25
): Promise<ConnectionsDal.DBConnection> {
  const result = await ConnectionsDal.create(
    {
      uid: data.initiatorUid ?? new ObjectId().toHexString(),
      name: data.initiatorName ?? "user" + new ObjectId().toHexString(),
    },
    {
      uid: data.friendUid ?? new ObjectId().toHexString(),
      name: data.friendName ?? "user" + new ObjectId().toHexString(),
    },
    maxPerUser
  );
  await ConnectionsDal.getCollection().updateOne(
    { _id: result._id },
    { $set: data }
  );
  return { ...result, ...data };
}
