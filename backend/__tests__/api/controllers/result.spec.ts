import request from "supertest";
import app from "../../../src/app";
import * as Configuration from "../../../src/init/configuration";
import * as ResultDal from "../../../src/dal/result";
import * as UserDal from "../../../src/dal/user";
import * as AuthUtils from "../../../src/utils/auth";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { messaging } from "firebase-admin";
const uid = "123456";

const mockDecodedToken: DecodedIdToken = {
  uid,
  email: "newuser@mail.com",
  iat: 0,
} as DecodedIdToken;

jest.spyOn(AuthUtils, "verifyIdToken").mockResolvedValue(mockDecodedToken);

const resultMock = jest.spyOn(ResultDal, "getResults");

const mockApp = request(app);

const configuration = Configuration.getCachedConfiguration();

describe("result controller test", () => {
  describe("getResults", () => {
    beforeEach(() => {
      resultMock.mockResolvedValue([]);
    });
    afterEach(() => {
      resultMock.mockReset();
    });
    it("should get latest 1000 results for regular user", async () => {
      //GIVEN
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(false);
      //WHEN
      await mockApp
        .get("/results")
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN
      expect(resultMock).toHaveBeenCalledWith(mockDecodedToken.uid, {
        limit: 1000,
        offset: 0,
        onOrAfterTimestamp: NaN,
      });
    });
    it("should get results filter by onOrAfterTimestamp", async () => {
      //GIVEN
      const now = Date.now();
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(false);
      //WHEN
      await mockApp
        .get("/results")
        .query({ onOrAfterTimestamp: now })
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN

      expect(resultMock).toHaveBeenCalledWith(mockDecodedToken.uid, {
        limit: 1000,
        offset: 0,
        onOrAfterTimestamp: now,
      });
    });
    it("should get with limit and offset", async () => {
      //GIVEN
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(false);

      //WHEN
      await mockApp
        .get("/results")
        .query({ offset: 500, limit: 250 })
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN
      expect(resultMock).toHaveBeenCalledWith(mockDecodedToken.uid, {
        limit: 250,
        offset: 500,
        onOrAfterTimestamp: NaN,
      });
    });
    it("should fail exceeding max limit for regular user", async () => {
      //GIVEN
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(false);

      //WHEN
      await mockApp
        .get("/results")
        .query({ limit: 600, offset: 800 })
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(422)
        .expect(
          expectErrorMessage(
            `Max results limit of ${
              (
                await configuration
              ).results.limits.regularUser
            } exceeded.`
          )
        );

      //THEN
    });
    it("should get with higher max limit for premium user", async () => {
      //GIVEN
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);

      //WHEN
      await mockApp
        .get("/results")
        .query({ offset: 600, limit: 800 })
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN

      expect(resultMock).toHaveBeenCalledWith(mockDecodedToken.uid, {
        limit: 800,
        offset: 600,
        onOrAfterTimestamp: NaN,
      });
    });
    it("should fail exceeding 1k limit", async () => {
      //GIVEN
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(false);

      //WHEN
      await mockApp
        .get("/results")
        .query({ limit: 2000 })
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(422)
        .expect(
          expectErrorMessage(
            '"limit" must be less than or equal to 1000 (2000)'
          )
        );

      //THEN
    });
    it("should fail exceeding maxlimit for premium user", async () => {
      //GIVEN
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);

      //WHEN
      await mockApp
        .get("/results")
        .query({ limit: 1000, offset: 24900 })
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(422)
        .expect(
          expectErrorMessage(
            `Max results limit of ${
              (
                await configuration
              ).results.limits.premiumUser
            } exceeded.`
          )
        );

      //THEN
    });
  });
});

function expectErrorMessage(message: string): (res: request.Response) => void {
  return (res) => expect(res.body).toHaveProperty("message", message);
}
