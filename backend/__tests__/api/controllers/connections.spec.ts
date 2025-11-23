import { describe, expect, it, vi, beforeEach } from "vitest";
import request, { Test as SuperTest } from "supertest";
import app from "../../../src/app";
import { mockBearerAuthentication } from "../../__testData__/auth";
import * as Configuration from "../../../src/init/configuration";
import { ObjectId } from "mongodb";
import * as ConnectionsDal from "../../../src/dal/connections";
import * as UserDal from "../../../src/dal/user";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();
const uid = new ObjectId().toHexString();
const mockAuth = mockBearerAuthentication(uid);

describe("ConnectionsController", () => {
  beforeEach(async () => {
    await enableConnectionsEndpoints(true);
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    mockAuth.beforeEach();
  });

  describe("get connections", () => {
    const getConnectionsMock = vi.spyOn(ConnectionsDal, "getConnections");

    beforeEach(() => {
      getConnectionsMock.mockClear();
    });

    it("should get for the current user", async () => {
      //GIVEN
      const friend: ConnectionsDal.DBConnection = {
        _id: new ObjectId(),
        lastModified: 42,
        initiatorUid: new ObjectId().toHexString(),
        initiatorName: "Bob",
        receiverUid: new ObjectId().toHexString(),
        receiverName: "Kevin",
        status: "pending",
        key: "key",
      };

      getConnectionsMock.mockResolvedValue([friend]);

      //WHEN
      const { body } = await mockApp
        .get("/connections")
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body.data).toEqual([
        { ...friend, _id: friend._id.toHexString(), key: undefined },
      ]);
      expect(getConnectionsMock).toHaveBeenCalledWith({
        initiatorUid: uid,
        receiverUid: uid,
      });
    });

    it("should filter by status", async () => {
      //GIVEN
      getConnectionsMock.mockResolvedValue([]);

      //WHEN
      await mockApp
        .get("/connections")
        .query({ status: "accepted" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(getConnectionsMock).toHaveBeenCalledWith({
        initiatorUid: uid,
        receiverUid: uid,
        status: ["accepted"],
      });
    });

    it("should filter by multiple status", async () => {
      //GIVEN
      getConnectionsMock.mockResolvedValue([]);

      //WHEN
      await mockApp
        .get("/connections")
        .query({ status: ["accepted", "blocked"] })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(getConnectionsMock).toHaveBeenCalledWith({
        initiatorUid: uid,
        receiverUid: uid,
        status: ["accepted", "blocked"],
      });
    });

    it("should filter by type incoming", async () => {
      //GIVEN
      getConnectionsMock.mockResolvedValue([]);

      //WHEN
      await mockApp
        .get("/connections")
        .query({ type: "incoming" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(getConnectionsMock).toHaveBeenCalledWith({
        receiverUid: uid,
      });
    });

    it("should filter by type outgoing", async () => {
      //GIVEN
      getConnectionsMock.mockResolvedValue([]);

      //WHEN
      await mockApp
        .get("/connections")
        .query({ type: "outgoing" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(getConnectionsMock).toHaveBeenCalledWith({
        initiatorUid: uid,
      });
    });

    it("should filter by multiple types", async () => {
      //GIVEN
      getConnectionsMock.mockResolvedValue([]);

      //WHEN
      await mockApp
        .get("/connections")
        .query({ type: ["incoming", "outgoing"] })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(getConnectionsMock).toHaveBeenCalledWith({
        initiatorUid: uid,
        receiverUid: uid,
      });
    });

    it("should fail if connections endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp.get("/connections").set("Authorization", `Bearer ${uid}`)
      );
    });
    it("should fail without authentication", async () => {
      await mockApp.get("/connections").expect(401);
    });
    it("should fail for unknown query parameter", async () => {
      const { body } = await mockApp
        .get("/connections")
        .query({ extra: "yes" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      expect(body).toStrictEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });

  describe("create connection", () => {
    const getUserByNameMock = vi.spyOn(UserDal, "getUserByName");
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");
    const createUserMock = vi.spyOn(ConnectionsDal, "create");

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

      const result: ConnectionsDal.DBConnection = {
        _id: new ObjectId(),
        lastModified: 42,
        initiatorUid: me.uid,
        initiatorName: me.name,
        receiverUid: myFriend.uid,
        receiverName: myFriend.name,
        key: "test",
        status: "pending",
      };
      createUserMock.mockResolvedValue(result);

      //WHEN
      const { body } = await mockApp
        .post("/connections")
        .send({ receiverName: "Kevin" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body.data).toEqual({
        _id: result._id.toHexString(),
        lastModified: 42,
        initiatorUid: me.uid,
        initiatorName: me.name,
        receiverUid: myFriend.uid,
        receiverName: myFriend.name,
        status: "pending",
      });

      expect(getUserByNameMock).toHaveBeenCalledWith(
        "Kevin",
        "create connection"
      );
      expect(getPartialUserMock).toHaveBeenCalledWith(
        uid,
        "create connection",
        ["uid", "name"]
      );
      expect(createUserMock).toHaveBeenCalledWith(me, myFriend, 100);
    });

    it("should fail if user and receiver are the same", async () => {
      //GIVEN
      const me = { uid, name: "Bob" };

      getUserByNameMock.mockResolvedValue(me as any);
      getPartialUserMock.mockResolvedValue(me as any);

      //WHEN
      const { body } = await mockApp
        .post("/connections")
        .send({ receiverName: "Bob" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(400);

      //THEN
      expect(body.message).toEqual("You cannot be your own friend, sorry.");
    });

    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/connections")
        .send({})
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      //THEN
      expect(body).toStrictEqual({
        message: "Invalid request data schema",
        validationErrors: [`"receiverName" Required`],
      });
    });
    it("should fail with extra properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/connections")
        .send({ receiverName: "1", extra: "value" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      //THEN
      expect(body).toStrictEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });

    it("should fail if connections endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp
          .post("/connections")
          .send({ receiverName: "1" })
          .set("Authorization", `Bearer ${uid}`)
      );
    });

    it("should fail without authentication", async () => {
      await mockApp.post("/connections").expect(401);
    });
  });

  describe("delete connection", () => {
    const deleteByIdMock = vi.spyOn(ConnectionsDal, "deleteById");

    beforeEach(() => {
      deleteByIdMock.mockClear().mockResolvedValue();
    });

    it("should delete by id", async () => {
      //WHEN
      await mockApp
        .delete("/connections/1")
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(deleteByIdMock).toHaveBeenCalledWith(uid, "1");
    });
    it("should fail if connections endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp.delete("/connections/1").set("Authorization", `Bearer ${uid}`)
      );
    });

    it("should fail without authentication", async () => {
      await mockApp.delete("/connections/1").expect(401);
    });
  });

  describe("update connection", () => {
    const updateStatusMock = vi.spyOn(ConnectionsDal, "updateStatus");

    beforeEach(() => {
      updateStatusMock.mockClear().mockResolvedValue();
    });

    it("should accept", async () => {
      //WHEN
      await mockApp
        .patch("/connections/1")
        .send({ status: "accepted" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(updateStatusMock).toHaveBeenCalledWith(uid, "1", "accepted");
    });
    it("should block", async () => {
      //WHEN
      await mockApp
        .patch("/connections/1")
        .send({ status: "blocked" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(updateStatusMock).toHaveBeenCalledWith(uid, "1", "blocked");
    });

    it("should fail for invalid status", async () => {
      const { body } = await mockApp
        .patch("/connections/1")
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
    it("should fail if connections endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp
          .patch("/connections/1")
          .send({ status: "accepted" })
          .set("Authorization", `Bearer ${uid}`)
      );
    });

    it("should fail without authentication", async () => {
      await mockApp
        .patch("/connections/1")
        .send({ status: "accepted" })
        .expect(401);
    });
  });
});

async function enableConnectionsEndpoints(enabled: boolean): Promise<void> {
  const mockConfig = await configuration;
  mockConfig.connections = { ...mockConfig.connections, enabled };

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function expectFailForDisabledEndpoint(call: SuperTest): Promise<void> {
  await enableConnectionsEndpoints(false);
  const { body } = await call.expect(503);
  expect(body.message).toEqual("Connections are not available at this time.");
}
