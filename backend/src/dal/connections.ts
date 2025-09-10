import { Collection, Filter, ObjectId } from "mongodb";
import * as db from "../init/db";
import { Connection, ConnectionStatus } from "@monkeytype/schemas/connections";
import MonkeyError from "../utils/error";
import { WithObjectId } from "../utils/misc";

export type DBConnection = WithObjectId<
  Connection & {
    key: string; //sorted uid
  }
>;

// Export for use in tests
export const getCollection = (): Collection<DBConnection> =>
  db.collection("connections");

export async function getConnections(options: {
  initiatorUid?: string;
  friendUid?: string;
  status?: ConnectionStatus[];
}): Promise<DBConnection[]> {
  const { initiatorUid, friendUid, status } = options;

  if (initiatorUid === undefined && friendUid === undefined)
    throw new Error("no filter provided");

  let filter: Filter<DBConnection> = { $or: [] };

  if (initiatorUid !== undefined) {
    filter.$or?.push({ initiatorUid });
  }

  if (friendUid !== undefined) {
    filter.$or?.push({ friendUid });
  }

  if (status !== undefined) {
    filter.status = { $in: status };
  }

  return await getCollection().find(filter).toArray();
}

export async function create(
  initiator: { uid: string; name: string },
  friend: { uid: string; name: string },
  maxPerUser: number
): Promise<DBConnection> {
  const count = await getCollection().countDocuments({
    initiatorUid: initiator.uid,
  });

  if (count >= maxPerUser) {
    throw new MonkeyError(
      409,
      "Maximum number of connections reached",
      "create connection request"
    );
  }
  try {
    const created: DBConnection = {
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
      throw new MonkeyError(409, "Duplicate connection or blocked");
    }

    throw e;
  }
}

/**
 *Update the status of a connection by id
 * @param friendUid
 * @param id
 * @param status
 * @throws MonkeyError if the connection id is unknown or the friendUid does not match
 */
export async function updateStatus(
  friendUid: string,
  id: string,
  status: ConnectionStatus
): Promise<void> {
  const updateResult = await getCollection().updateOne(
    {
      _id: new ObjectId(id),
      friendUid,
    },
    { $set: { status } }
  );

  if (updateResult.matchedCount === 0) {
    throw new MonkeyError(404, "Connection not found");
  }
}

/**
 * delete a connection by the id.
 * @param uid
 * @param id
 * @throws MonkeyError if the connection id is unknown or uid does not match
 */
export async function deleteById(uid: string, id: string): Promise<void> {
  const deletionResult = await getCollection().deleteOne({
    $and: [
      {
        _id: new ObjectId(id),
      },
      {
        $or: [
          { friendUid: uid },
          { status: { $in: ["accepted", "pending"] }, initiatorUid: uid },
        ],
      },
    ],
  });

  if (deletionResult.deletedCount === 0) {
    throw new MonkeyError(404, "Cannot be deleted");
  }
}

/**
 * Update all connections for the uid (initiator or friend) with the given name.
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
 * Remove all connections containing the uid as initiatorUid or friendUid
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

  //make sure there is only one connection for each friend/creator pair
  await getCollection().createIndex({ key: 1 }, { unique: true });
}
