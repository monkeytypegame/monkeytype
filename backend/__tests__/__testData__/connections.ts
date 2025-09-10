import { ObjectId } from "mongodb";
import * as FriendsDal from "../../src/dal/friends";

export async function createConnection(
  data: Partial<FriendsDal.DBFriendRequest>,
  maxPerUser = 25
): Promise<FriendsDal.DBFriendRequest> {
  const result = await FriendsDal.create(
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
  await FriendsDal.getCollection().updateOne(
    { _id: result._id },
    { $set: data }
  );
  return { ...result, ...data };
}
