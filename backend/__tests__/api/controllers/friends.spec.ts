import { describe, expect, it, vi, beforeEach } from "vitest";
import request, { Test as SuperTest } from "supertest";
import app from "../../../src/app";
import { mockBearerAuthentication } from "../../__testData__/auth";
import * as Configuration from "../../../src/init/configuration";
import { ObjectId } from "mongodb";
import _ from "lodash";
import * as FriendsDal from "../../../src/dal/friends";
import * as UserDal from "../../../src/dal/user";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();
const uid = new ObjectId().toHexString();
const mockAuth = mockBearerAuthentication(uid);

describe("FriendsController", () => {
  beforeEach(async () => {
    await enableFriendsEndpoints(true);
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    mockAuth.beforeEach();
  });

  describe("get friend requests", () => {
    const getFriendsMock = vi.spyOn(FriendsDal, "getRequests");

    beforeEach(() => {
      getFriendsMock.mockClear();
    });

    it("should get for the current user", async () => {
      //GIVEN
      const friend: FriendsDal.DBFriendRequest = {
        _id: new ObjectId(),
        addedAt: 42,
        initiatorUid: new ObjectId().toHexString(),
        initiatorName: "Bob",
        friendUid: new ObjectId().toHexString(),
        friendName: "Kevin",
        status: "pending",
        key: "key",
      };

      getFriendsMock.mockResolvedValue([friend]);

      //WHEN
      const { body } = await mockApp
        .get("/friends/requests")
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body.data).toEqual([{ ...friend, _id: friend._id.toHexString() }]);
      expect(getFriendsMock).toHaveBeenCalledWith({
        initiatorUid: uid,
        friendUid: uid,
      });
    });

    it("should filter by status", async () => {
      //GIVEN
      getFriendsMock.mockResolvedValue([]);

      //WHEN
      await mockApp
        .get("/friends/requests")
        .query({ status: "accepted" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(getFriendsMock).toHaveBeenCalledWith({
        initiatorUid: uid,
        friendUid: uid,
        status: ["accepted"],
      });
    });

    it("should filter by multiple status", async () => {
      //GIVEN
      getFriendsMock.mockResolvedValue([]);

      //WHEN
      await mockApp
        .get("/friends/requests")
        .query({ status: ["accepted", "blocked"] })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(getFriendsMock).toHaveBeenCalledWith({
        initiatorUid: uid,
        friendUid: uid,
        status: ["accepted", "blocked"],
      });
    });

    it("should filter by type incoming", async () => {
      //GIVEN
      getFriendsMock.mockResolvedValue([]);

      //WHEN
      await mockApp
        .get("/friends/requests")
        .query({ type: "incoming" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(getFriendsMock).toHaveBeenCalledWith({
        friendUid: uid,
      });
    });

    it("should filter by type outgoing", async () => {
      //GIVEN
      getFriendsMock.mockResolvedValue([]);

      //WHEN
      await mockApp
        .get("/friends/requests")
        .query({ type: "outgoing" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(getFriendsMock).toHaveBeenCalledWith({
        initiatorUid: uid,
      });
    });

    it("should filter by multiple types", async () => {
      //GIVEN
      getFriendsMock.mockResolvedValue([]);

      //WHEN
      await mockApp
        .get("/friends/requests")
        .query({ type: ["incoming", "outgoing"] })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(getFriendsMock).toHaveBeenCalledWith({
        initiatorUid: uid,
        friendUid: uid,
      });
    });

    it("should fail if friends endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp.get("/friends/requests").set("Authorization", `Bearer ${uid}`)
      );
    });
    it("should fail without authentication", async () => {
      await mockApp.get("/friends/requests").expect(401);
    });
    it("should fail for unknown query parameter", async () => {
      const { body } = await mockApp
        .get("/friends/requests")
        .query({ extra: "yes" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      expect(body).toStrictEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });

  describe("create friend request", () => {
    const getUserByNameMock = vi.spyOn(UserDal, "getUserByName");
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");
    const createUserMock = vi.spyOn(FriendsDal, "create");

    beforeEach(() => {
      [getUserByNameMock, getPartialUserMock, createUserMock].forEach((it) =>
        it.mockClear()
      );
    });

    it("should create", async () => {
      //GIVEN
      const me = { uid, name: "Bob" };
      const myFriend = { uid: new ObjectId().toHexString(), name: "Kevin" };
      getUserByNameMock.mockResolvedValue(myFriend as any);
      getPartialUserMock.mockResolvedValue(me as any);

      const result: FriendsDal.DBFriendRequest = {
        _id: new ObjectId(),
        addedAt: 42,
        initiatorUid: me.uid,
        initiatorName: me.name,
        friendUid: myFriend.uid,
        friendName: myFriend.name,
        key: "test",
        status: "pending",
      };
      createUserMock.mockResolvedValue(result);

      //WHEN
      const { body } = await mockApp
        .post("/friends/requests")
        .send({ friendName: "Kevin" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body.data).toEqual({
        _id: result._id.toHexString(),
        addedAt: 42,
        initiatorUid: me.uid,
        initiatorName: me.name,
        friendUid: myFriend.uid,
        friendName: myFriend.name,
        status: "pending",
      });

      expect(getUserByNameMock).toHaveBeenCalledWith("Kevin", "create friend");
      expect(getPartialUserMock).toHaveBeenCalledWith(uid, "create friend", [
        "uid",
        "name",
      ]);
      expect(createUserMock).toHaveBeenCalledWith(me, myFriend, 100);
    });

    it("should fail if user and friend are the same", async () => {
      //GIVEN
      const me = { uid, name: "Bob" };

      getUserByNameMock.mockResolvedValue(me as any);
      getPartialUserMock.mockResolvedValue(me as any);

      //WHEN
      const { body } = await mockApp
        .post("/friends/requests")
        .send({ friendName: "Bob" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(400);

      //THEN
      expect(body.message).toEqual("You cannot be your own friend, sorry.");
    });

    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/friends/requests")
        .send({})
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      //THEN
      expect(body).toStrictEqual({
        message: "Invalid request data schema",
        validationErrors: [`"friendName" Required`],
      });
    });
    it("should fail with extra properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/friends/requests")
        .send({ friendName: "1", extra: "value" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      //THEN
      expect(body).toStrictEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });

    it("should fail if friends endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp
          .post("/friends/requests")
          .send({ friendName: "1" })
          .set("Authorization", `Bearer ${uid}`)
      );
    });

    it("should fail without authentication", async () => {
      await mockApp.post("/friends/requests").expect(401);
    });
  });

  describe("delete friend request", () => {
    const deleteByIdMock = vi.spyOn(FriendsDal, "deleteById");

    beforeEach(() => {
      deleteByIdMock.mockClear().mockResolvedValue();
    });

    it("should delete by id", async () => {
      //WHEN
      await mockApp
        .delete("/friends/requests/1")
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(deleteByIdMock).toHaveBeenCalledWith(uid, "1");
    });
    it("should fail if friends endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp
          .delete("/friends/requests/1")
          .set("Authorization", `Bearer ${uid}`)
      );
    });

    it("should fail without authentication", async () => {
      await mockApp.delete("/friends/requests/1").expect(401);
    });
  });

  describe("update friend request", () => {
    const updateStatusMock = vi.spyOn(FriendsDal, "updateStatus");

    beforeEach(() => {
      updateStatusMock.mockClear().mockResolvedValue();
    });

    it("should accept", async () => {
      //WHEN
      await mockApp
        .patch("/friends/requests/1")
        .send({ status: "accepted" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(updateStatusMock).toHaveBeenCalledWith(uid, "1", "accepted");
    });
    it("should block", async () => {
      //WHEN
      await mockApp
        .patch("/friends/requests/1")
        .send({ status: "blocked" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(updateStatusMock).toHaveBeenCalledWith(uid, "1", "blocked");
    });

    it("should fail for invalid status", async () => {
      const { body } = await mockApp
        .patch("/friends/requests/1")
        .send({ status: "invalid" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          `"status" Invalid enum value. Expected 'accepted' | 'blocked', received 'invalid'`,
        ],
      });
    });
    it("should fail if friends endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp
          .patch("/friends/requests/1")
          .send({ status: "accepted" })
          .set("Authorization", `Bearer ${uid}`)
      );
    });

    it("should fail without authentication", async () => {
      await mockApp
        .patch("/friends/requests/1")
        .send({ status: "accepted" })
        .expect(401);
    });
  });
  describe("get friends", () => {
    const getFriendsMock = vi.spyOn(FriendsDal, "getFriends");

    beforeEach(() => {
      getFriendsMock.mockClear();
    });

    it("gets with premium enabled", async () => {
      //GIVEN
      enablePremiumFeatures(true);
      const friend: FriendsDal.DBFriend = {
        name: "Bob",
        isPremium: true,
      } as any;
      getFriendsMock.mockResolvedValue([friend]);

      //WHEN
      const { body } = await mockApp
        .get("/friends")
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body.data).toEqual([{ name: "Bob", isPremium: true }]);
    });

    it("gets with premium disabled", async () => {
      //GIVEN
      enablePremiumFeatures(false);
      const friend: FriendsDal.DBFriend = {
        name: "Bob",
        isPremium: true,
      } as any;
      getFriendsMock.mockResolvedValue([friend]);

      //WHEN
      const { body } = await mockApp
        .get("/friends")
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body.data).toEqual([{ name: "Bob" }]);
    });

    it("should fail if friends endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp.get("/friends").set("Authorization", `Bearer ${uid}`)
      );
    });

    it("should fail without authentication", async () => {
      await mockApp.get("/friends").expect(401);
    });
  });
});

async function enableFriendsEndpoints(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    friends: { enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
async function expectFailForDisabledEndpoint(call: SuperTest): Promise<void> {
  await enableFriendsEndpoints(false);
  const { body } = await call.expect(503);
  expect(body.message).toEqual("Friends are not available at this time.");
}

async function enablePremiumFeatures(premium: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { premium: { enabled: premium } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
