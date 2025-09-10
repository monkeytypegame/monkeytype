import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import { ObjectId } from "mongodb";

import * as FriendsDal from "../../../src/dal/friends";
import { createConnection as createFriend } from "../../__testData__/connections";

describe("FriendsDal", () => {
  beforeAll(async () => {
    await FriendsDal.createIndicies();
  });

  describe("getRequests", () => {
    it("get by uid", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const initOne = await createFriend({ initiatorUid: uid });
      const initTwo = await createFriend({ initiatorUid: uid });
      const friendOne = await createFriend({ friendUid: uid });
      const _decoy = await createFriend({});

      //WHEN / THEM

      expect(
        await FriendsDal.getRequests({ initiatorUid: uid, friendUid: uid })
      ).toStrictEqual([initOne, initTwo, friendOne]);
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
      const initBlocked = await createFriend({
        initiatorUid: uid,
        status: "blocked",
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

      //WHEN / THEN

      expect(
        await FriendsDal.getRequests({
          initiatorUid: uid,
          friendUid: uid,
          status: ["accepted", "blocked"],
        })
      ).toStrictEqual([initAccepted, initBlocked, friendAccepted]);
    });
  });

  describe("create", () => {
    const now = 1715082588;
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });
    afterEach(() => {
      vi.useRealTimers();
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
      ).rejects.toThrow("Duplicate friend or blocked");
    });

    it("should create", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const friendUid = new ObjectId().toHexString();

      //WHEN
      const created = await FriendsDal.create(
        { uid, name: "Bob" },
        { uid: friendUid, name: "Kevin" },
        2
      );

      //THEN
      expect(created).toEqual({
        _id: created._id,
        initiatorUid: uid,
        initiatorName: "Bob",
        friendUid: friendUid,
        friendName: "Kevin",
        addedAt: now,
        status: "pending",
        key: `${uid}/${friendUid}`,
      });
    });

    it("should fail if maximum friends are reached", async () => {
      //GIVEN
      const initiatorUid = new ObjectId().toHexString();
      await createFriend({ initiatorUid });
      await createFriend({ initiatorUid });

      //WHEN / THEM
      await expect(createFriend({ initiatorUid }, 2)).rejects.toThrow(
        "Maximum number of friends reached\nStack: create friend request"
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
        friendUid: uid,
      });

      //WHEN
      await FriendsDal.updateStatus(uid, first._id.toHexString(), "accepted");

      //THEN
      expect(await FriendsDal.getRequests({ friendUid: uid })).toEqual([
        { ...first, status: "accepted" },
        second,
      ]);

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
    it("should delete by initiator", async () => {
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
      expect(await FriendsDal.getRequests({ initiatorUid: uid })).toStrictEqual(
        [second]
      );
    });

    it("should delete by friend", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createFriend({
        friendUid: uid,
      });
      const second = await createFriend({
        friendUid: uid,
        status: "accepted",
      });

      //WHEN
      await FriendsDal.deleteById(uid, first._id.toHexString());

      //THEN
      expect(
        await FriendsDal.getRequests({ initiatorUid: second.initiatorUid })
      ).toStrictEqual([second]);
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
      ).rejects.toThrow("Cannot be deleted");
    });

    it("should fail if initiator deletes blocked by friend", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const myRequestWasBlocked = await createFriend({
        initiatorName: uid,
        status: "blocked",
      });

      //WHEN / THEN
      await expect(
        FriendsDal.deleteById(uid, myRequestWasBlocked._id.toHexString())
      ).rejects.toThrow("Cannot be deleted");
    });
    it("allow friend to delete blocked", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const myBlockedUser = await createFriend({
        friendUid: uid,
        status: "blocked",
      });

      //WHEN
      await FriendsDal.deleteById(uid, myBlockedUser._id.toHexString());

      //THEN
      expect(await FriendsDal.getRequests({ friendUid: uid })).toEqual([]);
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
      expect(
        await FriendsDal.getRequests({ initiatorUid: uid, friendUid: uid })
      ).toEqual([]);

      expect(
        await FriendsDal.getRequests({ initiatorUid: decoy.initiatorUid })
      ).toEqual([decoy]);
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
      expect(
        await FriendsDal.getRequests({ initiatorUid: uid, friendUid: uid })
      ).toEqual([
        { ...initOne, initiatorName: "King Bob" },
        { ...initTwo, initiatorName: "King Bob" },
        { ...friendOne, friendName: "King Bob" },
      ]);

      expect(
        await FriendsDal.getRequests({ initiatorUid: decoy.initiatorUid })
      ).toEqual([decoy]);
    });
  });
});
