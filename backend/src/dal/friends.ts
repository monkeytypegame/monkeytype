import { Collection, Filter, ObjectId } from "mongodb";
import * as db from "../init/db";
import {
  FriendRequest,
  FriendRequestStatus,
} from "@monkeytype/contracts/schemas/friends";
import MonkeyError from "../utils/error";
import { WithObjectId } from "../utils/misc";

export type DBFriend = WithObjectId<
  FriendRequest & {
    key: string; //sorted uid
  }
>;

// Export for use in tests
export const getCollection = (): Collection<DBFriend> =>
  db.collection("friends");

export async function get(
  uid: string,
  status?: FriendRequestStatus[]
): Promise<DBFriend[]> {
  let filter: Filter<DBFriend> = {
    $or: [{ initiatorUid: uid }, { friendUid: uid }],
  };
  if (status !== undefined) {
    filter = { $and: [filter, { status: { $in: status } }] };
  }

  return await getCollection().find(filter).toArray();
}

export async function create(
  initiator: { uid: string; name: string },
  friend: { uid: string; name: string }
): Promise<DBFriend> {
  try {
    const created: DBFriend = {
      _id: new ObjectId(),
      key: getKey(initiator.uid, friend.uid),
      initiatorUid: initiator.uid,
      initiatorName: initiator.name,
      friendUid: friend.uid,
      friendName: friend.name,
      addedAt: Date.now(),
      status: "pending",
    };

    await getCollection().insertOne(created);

    return created;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (e.name === "MongoServerError" && e.code === 11000) {
      throw new MonkeyError(409, "Duplicate friend");
    }

    throw e;
  }
}

/**
 *Update the status of a friend by id
 * @param friendUid
 * @param id
 * @param status
 * @throws MonkeyError if the friend id is unknown or the friendUid does not match
 */
export async function updateStatus(
  friendUid: string,
  id: string,
  status: FriendRequestStatus
): Promise<void> {
  const updateResult = await getCollection().updateOne(
    {
      _id: new ObjectId(id),
      friendUid,
    },
    { $set: { status } }
  );

  if (updateResult.matchedCount === 0) {
    throw new MonkeyError(404, "Friend not found");
  }
}

/**
 * delete a friend by the id.
 * @param initiatorUid
 * @param id
 * @throws MonkeyError if the friend id is unknown or the initiatorUid does not match
 */
export async function deleteById(
  initiatorUid: string,
  id: string
): Promise<void> {
  const deletionResult = await getCollection().deleteOne({
    _id: new ObjectId(id),
    initiatorUid,
  });

  if (deletionResult.deletedCount === 0) {
    throw new MonkeyError(404, "Friend not found");
  }
}

/**
 * Update all friends for the uid (initiator or friend) with the given name.
 * @param uid
 * @param newName
 */
export async function updateName(uid: string, newName: string): Promise<void> {
  await getCollection().bulkWrite([
    {
      updateMany: {
        filter: { initiatorUid: uid },
        update: { $set: { initiatorName: newName } },
      },
    },
    {
      updateMany: {
        filter: { friendUid: uid },
        update: { $set: { friendName: newName } },
      },
    },
  ]);
}

/**
 * Remove all friends containing the uid as initiatorUid or friendUid
 * @param uid
 */
export async function deleteByUid(uid: string): Promise<void> {
  await getCollection().deleteMany({
    $or: [{ initiatorUid: uid }, { friendUid: uid }],
  });
}

function getKey(initiatorUid: string, friendUid: string): string {
  const ids = [initiatorUid, friendUid];
  ids.sort();
  return ids.join("/");
}

export async function createIndicies(): Promise<void> {
  //index used for search
  await getCollection().createIndex({ initiatorUid: 1 });
  await getCollection().createIndex({ friendUid: 1 });

  //make sure there is only one friend entry for each friend/creator pair
  await getCollection().createIndex({ key: 1 }, { unique: true });
}
