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

import * as ConnectionsDal from "../../../src/dal/connections";
import { createConnection } from "../../__testData__/connections";

describe("ConnectionsDal", () => {
  beforeAll(async () => {
    await ConnectionsDal.createIndicies();
  });

  describe("getRequests", () => {
    it("get by uid", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const initOne = await createConnection({ initiatorUid: uid });
      const initTwo = await createConnection({ initiatorUid: uid });
      const friendOne = await createConnection({ friendUid: uid });
      const _decoy = await createConnection({});

      //WHEN / THEM

      expect(
        await ConnectionsDal.getConnections({
          initiatorUid: uid,
          friendUid: uid,
        })
      ).toStrictEqual([initOne, initTwo, friendOne]);
    });

    it("get by uid and status", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const initAccepted = await createConnection({
        initiatorUid: uid,
        status: "accepted",
      });
      const _initPending = await createConnection({
        initiatorUid: uid,
        status: "pending",
      });
      const initBlocked = await createConnection({
        initiatorUid: uid,
        status: "blocked",
      });

      const friendAccepted = await createConnection({
        friendUid: uid,
        status: "accepted",
      });
      const _friendPending = await createConnection({
        friendUid: uid,
        status: "pending",
      });

      const _decoy = await createConnection({ status: "accepted" });

      //WHEN / THEN

      expect(
        await ConnectionsDal.getConnections({
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
      const first = await createConnection({
        initiatorUid: uid,
      });

      //WHEN/THEN
      await expect(
        createConnection({
          initiatorUid: first.friendUid,
          friendUid: uid,
        })
      ).rejects.toThrow("Duplicate connection or blocked");
    });

    it("should create", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const friendUid = new ObjectId().toHexString();

      //WHEN
      const created = await ConnectionsDal.create(
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

    it("should fail if maximum connections are reached", async () => {
      //GIVEN
      const initiatorUid = new ObjectId().toHexString();
      await createConnection({ initiatorUid });
      await createConnection({ initiatorUid });

      //WHEN / THEM
      await expect(createConnection({ initiatorUid }, 2)).rejects.toThrow(
        "Maximum number of connections reached\nStack: create connection request"
      );
    });
  });
  describe("updateStatus", () => {
    it("should update the status", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createConnection({
        friendUid: uid,
      });
      const second = await createConnection({
        friendUid: uid,
      });

      //WHEN
      await ConnectionsDal.updateStatus(
        uid,
        first._id.toHexString(),
        "accepted"
      );

      //THEN
      expect(await ConnectionsDal.getConnections({ friendUid: uid })).toEqual([
        { ...first, status: "accepted" },
        second,
      ]);

      //can update twice to the same status
      await ConnectionsDal.updateStatus(
        uid,
        first._id.toHexString(),
        "accepted"
      );
    });
    it("should fail if uid does not match the friendUid", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createConnection({
        initiatorUid: uid,
      });

      //WHEN / THEN
      await expect(
        ConnectionsDal.updateStatus(uid, first._id.toHexString(), "accepted")
      ).rejects.toThrow("Connection not found");
    });
  });

  describe("deleteById", () => {
    it("should delete by initiator", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createConnection({
        initiatorUid: uid,
      });
      const second = await createConnection({
        initiatorUid: uid,
      });

      //WHEN
      await ConnectionsDal.deleteById(uid, first._id.toHexString());

      //THEN
      expect(
        await ConnectionsDal.getConnections({ initiatorUid: uid })
      ).toStrictEqual([second]);
    });

    it("should delete by friend", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createConnection({
        friendUid: uid,
      });
      const second = await createConnection({
        friendUid: uid,
        status: "accepted",
      });

      //WHEN
      await ConnectionsDal.deleteById(uid, first._id.toHexString());

      //THEN
      expect(
        await ConnectionsDal.getConnections({
          initiatorUid: second.initiatorUid,
        })
      ).toStrictEqual([second]);
    });

    it("should fail if uid does not match", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const first = await createConnection({
        initiatorUid: uid,
      });

      //WHEN / THEN
      await expect(
        ConnectionsDal.deleteById("Bob", first._id.toHexString())
      ).rejects.toThrow("Cannot be deleted");
    });

    it("should fail if initiator deletes blocked by friend", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const myRequestWasBlocked = await createConnection({
        initiatorName: uid,
        status: "blocked",
      });

      //WHEN / THEN
      await expect(
        ConnectionsDal.deleteById(uid, myRequestWasBlocked._id.toHexString())
      ).rejects.toThrow("Cannot be deleted");
    });
    it("allow friend to delete blocked", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const myBlockedUser = await createConnection({
        friendUid: uid,
        status: "blocked",
      });

      //WHEN
      await ConnectionsDal.deleteById(uid, myBlockedUser._id.toHexString());

      //THEN
      expect(await ConnectionsDal.getConnections({ friendUid: uid })).toEqual(
        []
      );
    });
  });

  describe("deleteByUid", () => {
    it("should delete by uid", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const _initOne = await createConnection({ initiatorUid: uid });
      const _initTwo = await createConnection({ initiatorUid: uid });
      const _friendOne = await createConnection({ friendUid: uid });
      const decoy = await createConnection({});

      //WHEN
      await ConnectionsDal.deleteByUid(uid);

      //THEN
      expect(
        await ConnectionsDal.getConnections({
          initiatorUid: uid,
          friendUid: uid,
        })
      ).toEqual([]);

      expect(
        await ConnectionsDal.getConnections({
          initiatorUid: decoy.initiatorUid,
        })
      ).toEqual([decoy]);
    });
  });
  describe("updateName", () => {
    it("should update the name", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();
      const initOne = await createConnection({
        initiatorUid: uid,
        initiatorName: "Bob",
      });
      const initTwo = await createConnection({
        initiatorUid: uid,
        initiatorName: "Bob",
      });
      const friendOne = await createConnection({
        friendUid: uid,
        friendName: "Bob",
      });
      const decoy = await createConnection({});

      //WHEN
      await ConnectionsDal.updateName(uid, "King Bob");

      //THEN
      expect(
        await ConnectionsDal.getConnections({
          initiatorUid: uid,
          friendUid: uid,
        })
      ).toEqual([
        { ...initOne, initiatorName: "King Bob" },
        { ...initTwo, initiatorName: "King Bob" },
        { ...friendOne, friendName: "King Bob" },
      ]);

      expect(
        await ConnectionsDal.getConnections({
          initiatorUid: decoy.initiatorUid,
        })
      ).toEqual([decoy]);
    });
  });
});
