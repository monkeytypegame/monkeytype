import request from "supertest";
import app from "../../../src/app";
import * as AuthUtils from "../../../src/utils/auth";
import { ObjectId } from "mongodb";
import * as Misc from "../../../src/utils/misc";
import { DecodedIdToken } from "firebase-admin/auth";

const uid = new ObjectId().toHexString();
const mockDecodedToken = {
  uid,
  email: "newuser@mail.com",
  iat: 0,
} as DecodedIdToken;
const mockApp = request(app);

describe("DevController", () => {
  const verifyIdTokenMock = vi.spyOn(AuthUtils, "verifyIdToken");
  beforeEach(() => {
    verifyIdTokenMock.mockReset().mockResolvedValue(mockDecodedToken);
  });

  describe("generate testData", () => {
    const isDevEnvironmentMock = vi.spyOn(Misc, "isDevEnvironment");

    beforeEach(() => {
      isDevEnvironmentMock.mockReset();
      isDevEnvironmentMock.mockReturnValue(true);
    });

    it("should fail on prod", async () => {
      //GIVEN
      isDevEnvironmentMock.mockReturnValue(false);
      //WHEN
      const { body } = await mockApp
        .post("/dev/generateData")
        .set("Authorization", "Bearer 123456789")
        .send({ username: "test" })
        .expect(503);
      //THEN
      expect(body.message).toEqual(
        "Development endpoints are only available in DEV mode."
      );
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/dev/generateData")
        .send({})
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [`"username" Required`],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/dev/generateData")
        .send({ username: "Bob", extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });
});
