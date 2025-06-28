import { ObjectId } from "mongodb";

import * as FriendsDal from "../../src/dal/friends";

describe("FriendsDal", () => {
  beforeAll(async () => {
    FriendsDal.createIndicies();
  });

  describe("get", () => {
    it("get by uid", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const initOne = await createFriend({ initiatorUid: uid });
      const initTwo = await createFriend({ initiatorUid: uid });
      const friendOne = await createFriend({ friendUid: uid });
      const _decoy = await createFriend({});

      //WHEN
      const myFriends = await FriendsDal.get(uid);

      //THEN
      expect(myFriends).toStrictEqual([initOne, initTwo, friendOne]);
    });

    it("get by uid and status", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const initAccepted = await createFriend({
        initiatorUid: uid,
        status: "accepted",
      });
      const _initPending = await createFriend({
        initiatorUid: uid,
        status: "pending",
      });
      const initRejected = await createFriend({
        initiatorUid: uid,
        status: "rejected",
      });

      const friendAccepted = await createFriend({
        friendUid: uid,
        status: "accepted",
      });
      const _friendPending = await createFriend({
        friendUid: uid,
        status: "pending",
      });

      const _decoy = await createFriend({ status: "accepted" });

      //WHEN
      const nonPending = await FriendsDal.get(uid, ["accepted", "rejected"]);

      //THEN
      expect(nonPending).toStrictEqual([
        initAccepted,
        initRejected,
        friendAccepted,
      ]);
    });
  });

  describe("create", () => {
    const now = 1715082588;
    beforeEach(() => {
      vitest.useFakeTimers();
      vitest.setSystemTime(now);
    });
    afterEach(() => {
      vitest.useRealTimers();
    });

    it("should fail creating duplicates", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createFriend({
        initiatorUid: uid,
      });

      //WHEN/THEN
      await expect(
        createFriend({
          initiatorUid: first.friendUid,
          friendUid: uid,
        })
      ).rejects.toThrow("Duplicate friend");
    });

    it("should create", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const friendUid = new ObjectId().toHexString();

      //WHEN
      const created = await FriendsDal.create(
        { uid, name: "Bob" },
        { uid: friendUid, name: "Kevin" }
      );

      //THEN
      expect(created).toEqual(
        expect.objectContaining({
          initiatorUid: uid,
          initiatorName: "Bob",
          friendUid: friendUid,
          friendName: "Kevin",
          addedAt: now,
          status: "pending",
          key: `${uid}/${friendUid}`,
        })
      );
    });
  });
  describe("updateStatus", () => {
    it("should update the status", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createFriend({
        friendUid: uid,
      });
      const second = await createFriend({
        initiatorUid: uid,
      });

      //WHEN
      await FriendsDal.updateStatus(uid, first._id.toHexString(), "accepted");

      //THEN
      expect(await FriendsDal.get(uid)).toEqual(
        expect.arrayContaining([{ ...first, status: "accepted" }, second])
      );

      //can update twice to the same status
      await FriendsDal.updateStatus(uid, first._id.toHexString(), "accepted");
    });
    it("should fail if uid does not match the friendUid", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createFriend({
        initiatorUid: uid,
      });

      //WHEN / THEN
      await expect(
        FriendsDal.updateStatus(uid, first._id.toHexString(), "accepted")
      ).rejects.toThrow("Friend not found");
    });
  });

  describe("deleteById", () => {
    it("should delete", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createFriend({
        initiatorUid: uid,
      });
      const second = await createFriend({
        initiatorUid: uid,
      });

      //WHEN
      await FriendsDal.deleteById(uid, first._id.toHexString());

      //THEN
      expect(await FriendsDal.get(uid)).toStrictEqual([second]);
    });
    it("should fail if uid does not match", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createFriend({
        initiatorUid: uid,
      });

      //WHEN / THEN
      await expect(
        FriendsDal.deleteById("Bob", first._id.toHexString())
      ).rejects.toThrow("Friend not found");
    });
  });

  describe("deleteByUid", () => {
    it("should delete by uid", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const _initOne = await createFriend({ initiatorUid: uid });
      const _initTwo = await createFriend({ initiatorUid: uid });
      const _friendOne = await createFriend({ friendUid: uid });
      const decoy = await createFriend({});

      //WHEN
      await FriendsDal.deleteByUid(uid);

      //THEN
      expect(await FriendsDal.get(uid)).toEqual([]);
      expect(await FriendsDal.get(decoy.initiatorUid)).toEqual([decoy]);
    });
  });
  describe("updateName", () => {
    it("should update the name", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const initOne = await createFriend({
        initiatorUid: uid,
        initiatorName: "Bob",
      });
      const initTwo = await createFriend({
        initiatorUid: uid,
        initiatorName: "Bob",
      });
      const friendOne = await createFriend({
        friendUid: uid,
        friendName: "Bob",
      });
      const decoy = await createFriend({});

      //WHEN
      await FriendsDal.updateName(uid, "King Bob");

      //THEN
      expect(await FriendsDal.get(uid)).toEqual([
        { ...initOne, initiatorName: "King Bob" },
        { ...initTwo, initiatorName: "King Bob" },
        { ...friendOne, friendName: "King Bob" },
      ]);

      expect(await FriendsDal.get(decoy.initiatorUid)).toEqual([decoy]);
    });
  });
});

async function createFriend(
  data: Partial<FriendsDal.DBFriend>
): Promise<FriendsDal.DBFriend> {
  const result = await FriendsDal.create(
    {
      uid: data.initiatorUid ?? new ObjectId().toHexString(),
      name: data.initiatorName ?? "user" + new ObjectId().toHexString(),
    },
    {
      uid: data.friendUid ?? new ObjectId().toHexString(),
      name: data.friendName ?? "user" + new ObjectId().toHexString(),
    }
  );
  await FriendsDal.getCollection().updateOne(
    { _id: result._id },
    { $set: data }
  );
  return { ...result, ...data };
}
