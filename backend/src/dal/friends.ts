import { Friend, FriendStatus } from "@monkeytype/contracts/schemas/friends";
import { Collection, Filter, ObjectId } from "mongodb";
import * as db from "../init/db";
import MonkeyError from "../utils/error";
import { WithObjectId } from "../utils/misc";
import _ from "lodash";
export type DBFriend = WithObjectId<
  Friend & {
    key: string; //sorted uid
  }
>;

export async function get(
  uid: string,
  status?: FriendStatus[]
): Promise<DBFriend[]> {
  let filter: Filter<DBFriend> = {
    $or: [{ initiatorUid: uid }, { friendUid: uid }],
  };
  if (status !== undefined) {
    filter = { $and: [filter, { status: { $in: status } }] };
  }
  return await getFriendsCollection().find(filter).toArray();
}

export async function create(
  initiator: { uid: string; name: string },
  friend: { uid: string; name: string }
): Promise<DBFriend> {
  try {
    const created = await getFriendsCollection().insertOne({
      _id: new ObjectId(),
      key: getKey(initiator.uid, friend.uid),
      initiatorUid: initiator.uid,
      initiatorName: initiator.name,
      friendUid: friend.uid,
      friendName: friend.name,
      addedAt: Date.now(),
      status: "pending",
    });
    const inserted = await getFriendsCollection().findOne({
      _id: created.insertedId,
    });

    if (inserted === null) {
      throw new MonkeyError(500, "Insert friend failed");
    }
    return inserted;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (e.name === "MongoServerError" && e.code === 11000) {
      throw new MonkeyError(409, "Duplicate friend");
    }

    throw e;
  }
}

export async function deleteFriend(
  initiatorUid: string,
  id: string
): Promise<void> {
  const deletionResult = await getFriendsCollection().deleteOne({
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
  await getFriendsCollection().bulkWrite([
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
  await getFriendsCollection().deleteMany({
    $or: [{ initiatorUid: uid }, { friendUid: uid }],
  });
}

function getFriendsCollection(): Collection<DBFriend> {
  return db.collection("friends");
}

function getKey(initiatorUid: string, friendUid: string): string {
  const ids = [initiatorUid, friendUid];
  ids.sort();
  return ids.join("/");
}

export async function createIndicies(): Promise<void> {
  //index used for search
  //make sure there is only one friend entry for each friend/creator pair
  await getFriendsCollection().createIndex({ key: 1 }, { unique: true });
}
