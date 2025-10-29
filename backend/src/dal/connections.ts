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

export const getCollection = (): Collection<DBConnection> =>
  db.collection("connections");

export async function getConnections(options: {
  initiatorUid?: string;
  receiverUid?: string;
  status?: ConnectionStatus[];
}): Promise<DBConnection[]> {
  const { initiatorUid, receiverUid, status } = options;

  if (initiatorUid === undefined && receiverUid === undefined)
    throw new Error("Missing filter");

  let filter: Filter<DBConnection> = { $or: [] };

  if (initiatorUid !== undefined) {
    filter.$or?.push({ initiatorUid });
  }

  if (receiverUid !== undefined) {
    filter.$or?.push({ receiverUid });
  }

  if (status !== undefined) {
    filter.status = { $in: status };
  }

  return await getCollection().find(filter).toArray();
}

export async function create(
  initiator: { uid: string; name: string },
  receiver: { uid: string; name: string },
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
  const key = getKey(initiator.uid, receiver.uid);
  try {
    const created: DBConnection = {
      _id: new ObjectId(),
      key,
      initiatorUid: initiator.uid,
      initiatorName: initiator.name,
      receiverUid: receiver.uid,
      receiverName: receiver.name,
      lastModified: Date.now(),
      status: "pending",
    };

    await getCollection().insertOne(created);

    return created;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (e.name === "MongoServerError" && e.code === 11000) {
      const existing = await getCollection().findOne(
        { key },
        { projection: { status: 1 } }
      );

      let message = "";

      if (existing?.status === "accepted") {
        message = "Connection already exists";
      } else if (existing?.status === "pending") {
        message = "Connection request already sent";
      } else if (existing?.status === "blocked") {
        if (existing.initiatorUid === initiator.uid) {
          message = "Connection blocked by initiator";
        } else {
          message = "Connection blocked by receiver";
        }
      } else {
        message = "Duplicate connection";
      }

      throw new MonkeyError(409, message);
    }

    throw e;
  }
}

/**
 *Update the status of a connection by id
 * @param receiverUid
 * @param id
 * @param status
 * @throws MonkeyError if the connection id is unknown or the recieverUid does not match
 */
export async function updateStatus(
  receiverUid: string,
  id: string,
  status: ConnectionStatus
): Promise<void> {
  const updateResult = await getCollection().updateOne(
    {
      _id: new ObjectId(id),
      receiverUid,
    },
    { $set: { status, lastModified: Date.now() } }
  );

  if (updateResult.matchedCount === 0) {
    throw new MonkeyError(404, "No permission or connection not found");
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
          { receiverUid: uid },
          { status: { $in: ["accepted", "pending"] }, initiatorUid: uid },
        ],
      },
    ],
  });

  if (deletionResult.deletedCount === 0) {
    throw new MonkeyError(404, "No permission or connection not found");
  }
}

/**
 * Update all connections for the uid (initiator or receiver) with the given name.
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
        filter: { receiverUid: uid },
        update: { $set: { receiverName: newName } },
      },
    },
  ]);
}

/**
 * Remove all connections containing the uid as initiatorUid or receiverUid
 * @param uid
 */
export async function deleteByUid(uid: string): Promise<void> {
  await getCollection().deleteMany({
    $or: [{ initiatorUid: uid }, { receiverUid: uid }],
  });
}

//TODO add test
export async function getFriendsUids(uid: string): Promise<string[]> {
  return Array.from(
    new Set(
      (
        await getCollection()
          .find(
            {
              $and: [
                {
                  $or: [{ initiatorUid: uid }, { receiverUid: uid }],
                  status: "accepted",
                },
              ],
            },
            { projection: { initiatorUid: true, receiverUid: true } }
          )
          .toArray()
      ).flatMap((it) => [it.initiatorUid, it.receiverUid])
    )
  );
}

function getKey(initiatorUid: string, receiverUid: string): string {
  const ids = [initiatorUid, receiverUid];
  ids.sort();
  return ids.join("/");
}

export async function createIndicies(): Promise<void> {
  //index used for search
  await getCollection().createIndex({ initiatorUid: 1, status: 1 });
  await getCollection().createIndex({ receiverUid: 1, status: 1 });

  //make sure there is only one connection for each initiatorr/receiver
  await getCollection().createIndex({ key: 1 }, { unique: true });
}
