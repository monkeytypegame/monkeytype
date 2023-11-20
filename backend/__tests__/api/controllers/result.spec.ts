import request from "supertest";
import app from "../../../src/app";
import _ from "lodash";
import * as Configuration from "../../../src/init/configuration";
import * as ResultDal from "../../../src/dal/result";
import * as UserDal from "../../../src/dal/user";
import * as AuthUtils from "../../../src/utils/auth";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
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
    beforeEach(async () => {
      resultMock.mockResolvedValue([]);
      await enablePremiumFeatures(true);
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
        .query({ limit: 250, offset: 500 })
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
        .query({ limit: 100, offset: 1000 })
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
        .query({ limit: 800, offset: 600 })
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
    it("should get results if offset/limit is partly outside the max limit", async () => {
      //GIVEN
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(false);

      //WHEN
      await mockApp
        .get("/results")
        .query({ limit: 20, offset: 990 })
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN

      expect(resultMock).toHaveBeenCalledWith(mockDecodedToken.uid, {
        limit: 10, //limit is reduced to stay within max limit
        offset: 990,
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
        .query({ limit: 1000, offset: 25000 })
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
    it("should get results within regular limits for premium users even if premium is globally disabled", async () => {
      //GIVEN
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);
      enablePremiumFeatures(false);

      //WHEN
      await mockApp
        .get("/results")
        .query({ limit: 100, offset: 900 })
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN
      expect(resultMock).toHaveBeenCalledWith(mockDecodedToken.uid, {
        limit: 100,
        offset: 900,
        onOrAfterTimestamp: NaN,
      });
    });
    it("should fail exceeding max limit for premium user if premium is globally disabled", async () => {
      //GIVEN
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);
      enablePremiumFeatures(false);

      //WHEN
      await mockApp
        .get("/results")
        .query({ limit: 200, offset: 900 })
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(503)
        .expect(expectErrorMessage("Premium feature disabled."));

      //THEN
    });
    it("should get results with regular limit as default for premium users if premium is globally disabled", async () => {
      //GIVEN
      jest.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);
      enablePremiumFeatures(false);

      //WHEN
      await mockApp
        .get("/results")
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN
      expect(resultMock).toHaveBeenCalledWith(mockDecodedToken.uid, {
        limit: 1000, //the default limit for regular users
        offset: 0,
        onOrAfterTimestamp: NaN,
      });
    });
  });
});

function expectErrorMessage(message: string): (res: request.Response) => void {
  return (res) => expect(res.body).toHaveProperty("message", message);
}

async function enablePremiumFeatures(premium: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { premium: { enabled: premium } },
  });

  jest
    .spyOn(Configuration, "getCachedConfiguration")
    .mockResolvedValue(mockConfig);
}
