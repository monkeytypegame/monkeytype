import { Collection, Filter, ObjectId } from "mongodb";
import * as db from "../init/db";
import {
  Friend,
  FriendRequest,
  FriendRequestStatus,
} from "@monkeytype/schemas/friends";
import MonkeyError from "../utils/error";
import { WithObjectId } from "../utils/misc";

export type DBFriendRequest = WithObjectId<
  FriendRequest & {
    key: string; //sorted uid
  }
>;

export type DBFriend = Friend;

// Export for use in tests
export const getCollection = (): Collection<DBFriendRequest> =>
  db.collection("friends");

export async function getRequests(options: {
  initiatorUid?: string;
  friendUid?: string;
  status?: FriendRequestStatus[];
}): Promise<DBFriendRequest[]> {
  const { initiatorUid, friendUid, status } = options;

  if (initiatorUid === undefined && friendUid === undefined)
    throw new Error("no filter provided");

  let filter: Filter<DBFriendRequest> = { $or: [] };

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
  maxFriendsPerUser: number
): Promise<DBFriendRequest> {
  const count = await getCollection().countDocuments({
    initiatorUid: initiator.uid,
  });

  if (count >= maxFriendsPerUser) {
    throw new MonkeyError(
      409,
      "Maximum number of friends reached",
      "create friend request"
    );
  }
  try {
    const created: DBFriendRequest = {
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
      throw new MonkeyError(409, "Duplicate friend or blocked");
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
 * @param uid
 * @param id
 * @throws MonkeyError if the friend id is unknown or uid does not match
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

export async function getFriends(uid: string): Promise<DBFriend[]> {
  return (await getCollection()
    .aggregate([
      {
        $match: {
          //uid is friend or initiator
          $and: [
            {
              $or: [{ initiatorUid: uid }, { friendUid: uid }],
              status: "accepted",
            },
          ],
        },
      },
      {
        $project: {
          friendUid: true,
          initiatorUid: true,
          addedAt: true,
        },
      },
      {
        $addFields: {
          //pick the other user, not uid
          uid: {
            $cond: {
              if: { $eq: ["$friendUid", uid] },
              // oxlint-disable-next-line no-thenable
              then: "$initiatorUid",
              else: "$friendUid",
            },
          },
        },
      },
      // we want to fetch the data for our uid as well, add it to the list of documents
      // workaround for missing unionWith + $documents in mongodb 5.0
      {
        $group: {
          _id: null,
          data: {
            $push: {
              uid: "$uid",
              addedAt: "$addedAt",
              friendRequestId: "$_id",
            },
          },
        },
      },
      {
        $project: {
          data: {
            $concatArrays: ["$data", [{ uid }]],
          },
        },
      },
      {
        $unwind: "$data",
      },

      /* end of workaround, this is the replacement for >= 5.1
    
      { $addFields: { friendRequestId: "$_id" } },
      { $project: { uid: true, addedAt: true, friendRequestId: true } },
      {
        $unionWith: {
          pipeline: [{ $documents: [{ uid }] }],
        },
      },
      */

      {
        $lookup: {
          /* query users to get the friend data */
          from: "users",
          localField: "data.uid", //just uid if we remove the workaround above
          foreignField: "uid",
          as: "result",
          let: {
            addedAt: "$data.addedAt", //just $addedAt if we remove the workaround above
            friendRequestId: "$data.friendRequestId", //just $friendRequestId if we remove the workaround above
          },
          pipeline: [
            {
              $project: {
                _id: false,
                uid: true,
                friendRequestId: true,
                name: true,
                discordId: true,
                discordAvatar: true,
                startedTests: true,
                completedTests: true,
                timeTyping: true,
                xp: true,
                streak: true,
                personalBests: true,
                "inventory.badges": true,
                "premium.expirationTimestamp": true,
                banned: 1,
                lbOptOut: 1,
              },
            },
            {
              $addFields: {
                addedAt: "$$addedAt",
                friendRequestId: "$$friendRequestId",
                top15: {
                  $reduce: {
                    //find highest wpm from time 15 PBs
                    input: "$personalBests.time.15",
                    initialValue: {},
                    in: {
                      $cond: [
                        { $gte: ["$$this.wpm", "$$value.wpm"] },
                        "$$this",
                        "$$value",
                      ],
                    },
                  },
                },
                top60: {
                  $reduce: {
                    //find highest wpm from time 60 PBs
                    input: "$personalBests.time.60",
                    initialValue: {},
                    in: {
                      $cond: [
                        { $gte: ["$$this.wpm", "$$value.wpm"] },
                        "$$this",
                        "$$value",
                      ],
                    },
                  },
                },
                badgeId: {
                  $ifNull: [
                    {
                      $first: {
                        $map: {
                          input: {
                            $filter: {
                              input: "$inventory.badges",
                              as: "badge",
                              cond: { $eq: ["$$badge.selected", true] },
                            },
                          },
                          as: "selectedBadge",
                          in: "$$selectedBadge.id",
                        },
                      },
                    },
                    "$$REMOVE",
                  ],
                },
                isPremium: {
                  $cond: {
                    if: {
                      $or: [
                        { $eq: ["$premium.expirationTimestamp", -1] },
                        {
                          $gt: [
                            "$premium.expirationTimestamp",
                            { $toLong: "$$NOW" },
                          ],
                        },
                      ],
                    },
                    // oxlint-disable-next-line no-thenable
                    then: true,
                    else: "$$REMOVE",
                  },
                },
              },
            },
            {
              $addFields: {
                //remove nulls
                top15: { $ifNull: ["$top15", "$$REMOVE"] },
                top60: { $ifNull: ["$top60", "$$REMOVE"] },
                badgeId: { $ifNull: ["$badgeId", "$$REMOVE"] },
                addedAt: "$addedAt",
              },
            },
            {
              $project: {
                personalBests: false,
                inventory: false,
                premium: false,
              },
            },
          ],
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $cond: [
              { $gt: [{ $size: "$result" }, 0] },
              { $first: "$result" },
              {}, // empty document fallback, this can happen if the user is not present
            ],
          },
        },
      },
    ])
    .toArray()) as DBFriend[];
}

export async function getFriendsUids(uid: string): Promise<string[]> {
  return Array.from(
    new Set(
      (
        await getCollection()
          .find(
            {
              $and: [
                {
                  $or: [{ initiatorUid: uid }, { friendUid: uid }],
                  status: "accepted",
                },
              ],
            },
            { projection: { initiatorUid: true, friendUid: true } }
          )
          .toArray()
      ).flatMap((it) => [it.initiatorUid, it.friendUid])
    )
  );
}

export async function createIndicies(): Promise<void> {
  //index used for search
  await getCollection().createIndex({ initiatorUid: 1 });
  await getCollection().createIndex({ friendUid: 1 });

  //make sure there is only one friend entry for each friend/creator pair
  await getCollection().createIndex({ key: 1 }, { unique: true });
}
