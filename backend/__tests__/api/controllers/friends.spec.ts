import request, { Test as SuperTest } from "supertest";
import app from "../../../src/app";
import { mockBearerAuthentication } from "../../__testData__/auth";
import * as Configuration from "../../../src/init/configuration";
import { ObjectId } from "mongodb";
import _ from "lodash";
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

  describe("get friends", () => {
    it("should fail if friends endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp.get("/friends").set("Authorization", `Bearer ${uid}`)
      );
    });
    it("should fail without authentication", async () => {
      await mockApp.get("/friends").expect(401);
    });
  });

  describe("create friend", () => {
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/friends")
        .send({})
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      //THEN
      expect(body).toStrictEqual({
        message: "Invalid request data schema",
        validationErrors: [`"friendUid" Required`],
      });
    });
    it("should fail with extra properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/friends")
        .send({ friendUid: "1", extra: "value" })
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
          .post("/friends")
          .send({ friendUid: "1" })
          .set("Authorization", `Bearer ${uid}`)
      );
    });

    it("should fail without authentication", async () => {
      await mockApp.post("/friends").expect(401);
    });
  });

  describe("delete friend", () => {
    it("should fail if friends endpoints are disabled", async () => {
      await expectFailForDisabledEndpoint(
        mockApp.delete("/friends/1").set("Authorization", `Bearer ${uid}`)
      );
    });

    it("should fail without authentication", async () => {
      await mockApp.delete("/friends/1").expect(401);
    });
  });
});

async function enableFriendsEndpoints(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { friends: { enabled } },
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
