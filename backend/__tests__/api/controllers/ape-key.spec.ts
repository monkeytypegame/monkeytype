import request, { Test as SuperTest } from "supertest";
import app from "../../../src/app";
import * as ApeKeyDal from "../../../src/dal/ape-keys";
import { ObjectId } from "mongodb";
import * as Configuration from "../../../src/init/configuration";
import * as UserDal from "../../../src/dal/user";
import _ from "lodash";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();
const uid = new ObjectId().toHexString();

describe("ApeKeyController", () => {
  const getUserMock = vi.spyOn(UserDal, "getPartialUser");

  beforeEach(async () => {
    await enableApeKeysEndpoints(true);
    getUserMock.mockResolvedValue(user(uid, {}));
    vi.useFakeTimers();
    vi.setSystemTime(1000);
  });

  afterEach(() => {
    getUserMock.mockReset();
    vi.useRealTimers();
  });

  describe("get ape keys", () => {
    const getApeKeysMock = vi.spyOn(ApeKeyDal, "getApeKeys");

    afterEach(() => {
      getApeKeysMock.mockReset();
    });

    it("should get the users config", async () => {
      //GIVEN
      const keyOne = apeKeyDb(uid);
      const keyTwo = apeKeyDb(uid);
      getApeKeysMock.mockResolvedValue([keyOne, keyTwo]);

      //WHEN
      const { body } = await mockApp
        .get("/ape-keys")
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toHaveProperty("message", "ApeKeys retrieved");
      expect(body.data).toHaveProperty(keyOne._id.toHexString(), {
        name: keyOne.name,
        enabled: keyOne.enabled,
        createdOn: keyOne.createdOn,
        modifiedOn: keyOne.modifiedOn,
        lastUsedOn: keyOne.lastUsedOn,
      });
      expect(body.data).toHaveProperty(keyTwo._id.toHexString(), {
        name: keyTwo.name,
        enabled: keyTwo.enabled,
        createdOn: keyTwo.createdOn,
        modifiedOn: keyTwo.modifiedOn,
        lastUsedOn: keyTwo.lastUsedOn,
      });
      expect(body.data).keys([keyOne._id, keyTwo._id]);

      expect(getApeKeysMock).toHaveBeenCalledWith(uid);
    });
    it("should fail if apeKeys endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp.get("/ape-keys").set("authorization", `Uid ${uid}`)
      );
    });
    it("should fail if user has no apeKey permissions", async () => {
      await expectFailForNoPermissions(
        mockApp.get("/ape-keys").set("authorization", `Uid ${uid}`)
      );
    });
  });

  describe("add ape key", () => {
    const addApeKeyMock = vi.spyOn(ApeKeyDal, "addApeKey");
    const countApeKeysMock = vi.spyOn(ApeKeyDal, "countApeKeysForUser");

    beforeEach(() => {
      countApeKeysMock.mockResolvedValue(0);
    });

    afterEach(() => {
      addApeKeyMock.mockReset();
      countApeKeysMock.mockReset();
    });

    it("should add ape key", async () => {
      //GIVEN
      addApeKeyMock.mockResolvedValue("1");

      //WHEN
      const { body } = await mockApp
        .post("/ape-keys")
        .set("authorization", `Uid ${uid}`)
        .send({ name: "test", enabled: true })
        .expect(200);

      expect(body.message).toEqual("ApeKey generated");
      expect(body.data).keys("apeKey", "apeKeyDetails", "apeKeyId");
      expect(body.data.apeKey).not.toBeNull();

      expect(body.data.apeKeyDetails).toStrictEqual({
        createdOn: 1000,
        enabled: true,
        lastUsedOn: -1,
        modifiedOn: 1000,
        name: "test",
      });

      expect(body.data.apeKeyId).toEqual("1");

      expect(addApeKeyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          createdOn: 1000,
          enabled: true,
          lastUsedOn: -1,
          modifiedOn: 1000,
          name: "test",
          uid: uid,
          useCount: 0,
        })
      );
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/ape-keys")
        .send({})
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toStrictEqual({
        message: "Invalid request data schema",
        validationErrors: [`"name" Required`, `"enabled" Required`],
      });
    });
    it("should fail with extra properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/ape-keys")
        .send({ name: "test", enabled: true, extra: "value" })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toStrictEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });

    it("should fail if max apeKeys is reached", async () => {
      //GIVEN
      countApeKeysMock.mockResolvedValue(1);

      //WHEN
      const { body } = await mockApp
        .post("/ape-keys")
        .send({ name: "test", enabled: false })
        .set("authorization", `Uid ${uid}`)
        .expect(409);

      //THEN
      expect(body.message).toEqual(
        "Maximum number of ApeKeys have been generated"
      );
    });
    it("should fail if apeKeys endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp
          .post("/ape-keys")
          .send({ name: "test", enabled: false })
          .set("authorization", `Uid ${uid}`)
      );
    });
    it("should fail if user has no apeKey permissions", async () => {
      await expectFailForNoPermissions(
        mockApp
          .post("/ape-keys")
          .send({ name: "test", enabled: false })
          .set("authorization", `Uid ${uid}`)
      );
    });
  });

  describe("edit ape key", () => {
    const editApeKeyMock = vi.spyOn(ApeKeyDal, "editApeKey");
    const apeKeyId = new ObjectId().toHexString();

    afterEach(() => {
      editApeKeyMock.mockReset();
    });

    it("should edit ape key", async () => {
      //GIVEN
      editApeKeyMock.mockResolvedValue();

      //WHEN
      const { body } = await mockApp
        .patch(`/ape-keys/${apeKeyId}`)
        .send({ name: "new", enabled: false })
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body.message).toEqual("ApeKey updated");
      expect(editApeKeyMock).toHaveBeenCalledWith(uid, apeKeyId, "new", false);
    });
    it("should edit ape key with single property", async () => {
      //GIVEN
      editApeKeyMock.mockResolvedValue();

      //WHEN
      const { body } = await mockApp
        .patch(`/ape-keys/${apeKeyId}`)
        .send({ name: "new" })
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body.message).toEqual("ApeKey updated");
      expect(editApeKeyMock).toHaveBeenCalledWith(
        uid,
        apeKeyId,
        "new",
        undefined
      );
    });
    it("should fail with missing path", async () => {
      //GIVEN

      //WHEN
      await mockApp
        .patch(`/ape-keys/`)
        .set("authorization", `Uid ${uid}`)
        .expect(404);
    });
    it("should fail with extra properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .patch(`/ape-keys/${apeKeyId}`)
        .send({ name: "new", extra: "value" })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toStrictEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail if apeKeys endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp
          .patch(`/ape-keys/${apeKeyId}`)
          .send({ name: "test", enabled: false })
          .set("authorization", `Uid ${uid}`)
      );
    });
    it("should fail if user has no apeKey permissions", async () => {
      await expectFailForNoPermissions(
        mockApp
          .patch(`/ape-keys/${apeKeyId}`)
          .send({ name: "test", enabled: false })
          .set("authorization", `Uid ${uid}`)
      );
    });
  });
  describe("delete ape key", () => {
    const deleteApeKeyMock = vi.spyOn(ApeKeyDal, "deleteApeKey");
    const apeKeyId = new ObjectId().toHexString();

    afterEach(() => {
      deleteApeKeyMock.mockReset();
    });

    it("should delete ape key", async () => {
      //GIVEN

      deleteApeKeyMock.mockResolvedValue();
      //WHEN
      const { body } = await mockApp
        .delete(`/ape-keys/${apeKeyId}`)
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body.message).toEqual("ApeKey deleted");
      expect(deleteApeKeyMock).toHaveBeenCalledWith(uid, apeKeyId);
    });
    it("should fail with missing path", async () => {
      //GIVEN

      //WHEN
      await mockApp
        .delete(`/ape-keys/`)
        .set("authorization", `Uid ${uid}`)
        .expect(404);
    });
    it("should fail if apeKeys endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp
          .delete(`/ape-keys/${apeKeyId}`)
          .set("authorization", `Uid ${uid}`)
      );
    });

    it("should fail if user has no apeKey permissions", async () => {
      await expectFailForNoPermissions(
        mockApp
          .delete(`/ape-keys/${apeKeyId}`)
          .set("authorization", `Uid ${uid}`)
      );
    });
  });
  async function expectFailForNoPermissions(call: SuperTest): Promise<void> {
    getUserMock.mockResolvedValue(user(uid, { canManageApeKeys: false }));
    const { body } = await call.expect(403);
    expect(body.message).toEqual(
      "You have lost access to ape keys, please contact support"
    );
  }
  async function expectFailForDisabledEndpoint(call: SuperTest): Promise<void> {
    await enableApeKeysEndpoints(false);
    const { body } = await call.expect(503);
    expect(body.message).toEqual("ApeKeys are currently disabled.");
  }
});

function apeKeyDb(
  uid: string,
  data?: Partial<ApeKeyDal.DBApeKey>
): ApeKeyDal.DBApeKey {
  return {
    _id: new ObjectId(),
    uid,
    hash: "hash",
    useCount: 1,
    name: "name",
    enabled: true,
    createdOn: Math.random() * Date.now(),
    lastUsedOn: Math.random() * Date.now(),
    modifiedOn: Math.random() * Date.now(),
    ...data,
  };
}

async function enableApeKeysEndpoints(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    apeKeys: { endpointsEnabled: enabled, maxKeysPerUser: 1 },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

function user(uid: string, data: Partial<UserDal.DBUser>): UserDal.DBUser {
  return {
    uid,
    ...data,
  } as UserDal.DBUser;
}
