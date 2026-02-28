import { ObjectId } from "mongodb";
import * as ConnectionsDal from "../../src/dal/connections";

export async function createConnection(
  data: Partial<ConnectionsDal.DBConnection>,
  maxPerUser = 25,
): Promise<ConnectionsDal.DBConnection> {
  const defaultName = "user" + new ObjectId().toHexString();
  const result = await ConnectionsDal.create(
    {
      uid: data.initiatorUid ?? new ObjectId().toHexString(),
      name: data.initiatorName ?? defaultName,
    },
    {
      uid: data.receiverUid ?? new ObjectId().toHexString(),
      name: data.receiverName ?? defaultName,
    },
    maxPerUser,
  );
  await ConnectionsDal.__testing
    .getCollection()
    .updateOne({ _id: result._id }, { $set: data });
  return { ...result, ...data };
}
