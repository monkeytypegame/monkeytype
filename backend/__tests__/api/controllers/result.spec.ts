import request from "supertest";
import app from "../../../src/app";
import _, { omit } from "lodash";
import * as Configuration from "../../../src/init/configuration";
import * as ResultDal from "../../../src/dal/result";
import * as UserDal from "../../../src/dal/user";
import * as LogsDal from "../../../src/dal/logs";
import * as AuthUtils from "../../../src/utils/auth";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { ObjectId } from "mongodb";
import { mockAuthenticateWithApeKey } from "../../__testData__/auth";
const uid = "123456";

const mockDecodedToken: DecodedIdToken = {
  uid,
  email: "newuser@mail.com",
  iat: 0,
} as DecodedIdToken;

const mockApp = request(app);

const configuration = Configuration.getCachedConfiguration();

describe("result controller test", () => {
  const verifyIdTokenMock = vi.spyOn(AuthUtils, "verifyIdToken");

  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    verifyIdTokenMock.mockResolvedValue(mockDecodedToken);
  });

  describe("getResults", () => {
    const resultMock = vi.spyOn(ResultDal, "getResults");

    beforeEach(async () => {
      resultMock.mockResolvedValue([]);
      await enablePremiumFeatures(true);
      vi.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(false);
    });

    afterEach(() => {
      resultMock.mockReset();
    });

    it("should get results", async () => {
      //GIVEN
      const resultOne = givenDbResult(uid);
      const resultTwo = givenDbResult(uid);
      resultMock.mockResolvedValue([resultOne, resultTwo]);

      //WHEN
      const { body } = await mockApp
        .get("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(200);

      //THEN

      expect(body.message).toEqual("Results retrieved");
      expect(body.data).toEqual([
        { ...resultOne, _id: resultOne._id.toHexString() },
        { ...resultTwo, _id: resultTwo._id.toHexString() },
      ]);
    });
    it("should get results with ape key", async () => {
      //GIVEN
      await acceptApeKeys(true);
      const apeKey = await mockAuthenticateWithApeKey(uid, await configuration);

      //WHEN
      await mockApp
        .get("/results")
        .set("Authorization", `ApeKey ${apeKey}`)
        .send()
        .expect(200);
    });
    it("should get latest 1000 results for regular user", async () => {
      //WHEN
      await mockApp
        .get("/results")
        .set("Authorization", `Bearer ${uid}`)
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
      //WHEN
      await mockApp
        .get("/results")
        .query({ onOrAfterTimestamp: now })
        .set("Authorization", `Bearer ${uid}`)
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
      //WHEN
      await mockApp
        .get("/results")
        .query({ limit: 250, offset: 500 })
        .set("Authorization", `Bearer ${uid}`)
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
      //WHEN
      const { body } = await mockApp
        .get("/results")
        .query({ limit: 100, offset: 1000 })
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(422);

      //THEN
      expect(body.message).toEqual(
        `Max results limit of ${
          (await configuration).results.limits.regularUser
        } exceeded.`
      );
    });
    it("should get with higher max limit for premium user", async () => {
      //GIVEN
      vi.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);

      //WHEN
      await mockApp
        .get("/results")
        .query({ limit: 800, offset: 600 })
        .set("Authorization", `Bearer ${uid}`)
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
      //WHEN
      await mockApp
        .get("/results")
        .query({ limit: 20, offset: 990 })
        .set("Authorization", `Bearer ${uid}`)
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
      vi.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(false);

      //WHEN
      const { body } = await mockApp
        .get("/results")
        .query({ limit: 2000 })
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(422);

      //THEN
      expect(body.message).toEqual(
        '"limit" must be less than or equal to 1000 (2000)'
      );
    });
    it("should fail exceeding maxlimit for premium user", async () => {
      //GIVEN
      vi.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);

      //WHEN
      const { body } = await mockApp
        .get("/results")
        .query({ limit: 1000, offset: 25000 })
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(422);
      //THEN
      expect(body.message).toEqual(
        `Max results limit of ${
          (await configuration).results.limits.premiumUser
        } exceeded.`
      );
    });
    it("should get results within regular limits for premium users even if premium is globally disabled", async () => {
      //GIVEN
      vi.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);
      enablePremiumFeatures(false);

      //WHEN
      await mockApp
        .get("/results")
        .query({ limit: 100, offset: 900 })
        .set("Authorization", `Bearer ${uid}`)
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
      vi.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);
      enablePremiumFeatures(false);

      //WHEN
      const { body } = await mockApp
        .get("/results")
        .query({ limit: 200, offset: 900 })
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(503);

      //THEN
      expect(body.message).toEqual("Premium feature disabled.");
    });
    it("should get results with regular limit as default for premium users if premium is globally disabled", async () => {
      //GIVEN
      vi.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);
      enablePremiumFeatures(false);

      //WHEN
      await mockApp
        .get("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(200);

      //THEN
      expect(resultMock).toHaveBeenCalledWith(mockDecodedToken.uid, {
        limit: 1000, //the default limit for regular users
        offset: 0,
        onOrAfterTimestamp: NaN,
      });
    });
    it("should fail with unknown query parameters", async () => {
      //WHEN
      const { body } = await mockApp
        .get("/results")
        .query({ extra: "value" })
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(422);

      //THEN
      //TODO
      /*expect(body).toEqual({
        message: "",
        validationErrors: [],
      });*/
    });
  });
  describe("getLastResult", () => {
    const getLastResultMock = vi.spyOn(ResultDal, "getLastResult");

    afterEach(() => {
      getLastResultMock.mockReset();
    });

    it("should get last result", async () => {
      //GIVEN
      const result = givenDbResult(uid);
      getLastResultMock.mockResolvedValue(result);

      //WHEN
      const { body } = await mockApp
        .get("/results/last")
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(200);

      //THEN
      expect(body.message).toEqual("Result retrieved");
      expect(body.data).toEqual({ ...result, _id: result._id.toHexString() });
    });
    it("should get last result with ape key", async () => {
      //GIVEN
      await acceptApeKeys(true);
      const apeKey = await mockAuthenticateWithApeKey(uid, await configuration);

      //WHEN
      await mockApp
        .get("/results/last")
        .set("Authorization", `ApeKey ${apeKey}`)
        .send()
        .expect(200);
    });
  });
  describe("deleteAll", () => {
    const deleteAllMock = vi.spyOn(ResultDal, "deleteAll");
    const logToDbMock = vi.spyOn(LogsDal, "addLog");
    afterEach(() => {
      deleteAllMock.mockReset();
      logToDbMock.mockReset();
    });

    it("should delete", async () => {
      //GIVEN
      verifyIdTokenMock.mockResolvedValue({
        ...mockDecodedToken,
        iat: Date.now() - 1000,
      });
      //WHEN
      const { body } = await mockApp
        .delete("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(200);

      //THEN
      expect(body.message).toEqual("All results deleted");
      expect(body.data).toBeNull();

      expect(deleteAllMock).toHaveBeenCalledWith(uid);
      expect(logToDbMock).toHaveBeenCalledWith("user_results_deleted", "", uid);
    });
    it("should fail to delete with non-fresh token", async () => {
      await mockApp
        .delete("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(401);
    });
  });
  describe("updateTags", () => {
    const getResultMock = vi.spyOn(ResultDal, "getResult");
    const updateTagsMock = vi.spyOn(ResultDal, "updateTags");
    const getUserPartialMock = vi.spyOn(UserDal, "getPartialUser");
    const checkIfTagPbMock = vi.spyOn(UserDal, "checkIfTagPb");

    afterEach(() => {
      [
        getResultMock,
        updateTagsMock,
        getUserPartialMock,
        checkIfTagPbMock,
      ].forEach((it) => it.mockReset());
    });

    it("should update tags", async () => {
      //GIVEN
      const result = givenDbResult(uid);
      const resultIdString = result._id.toHexString();
      const tagIds = [
        new ObjectId().toHexString(),
        new ObjectId().toHexString(),
      ];
      const partialUser = { tags: [] };
      getResultMock.mockResolvedValue(result);
      updateTagsMock.mockResolvedValue({} as any);
      getUserPartialMock.mockResolvedValue(partialUser as any);
      checkIfTagPbMock.mockResolvedValue([]);

      //WHEN
      const { body } = await mockApp
        .patch("/results/tags")
        .set("Authorization", `Bearer ${uid}`)
        .send({ resultId: resultIdString, tagIds })
        .expect(200);

      //THEN
      expect(body.message).toEqual("Result tags updated");
      expect(body.data).toEqual({
        tagPbs: [],
      });

      expect(updateTagsMock).toHaveBeenCalledWith(uid, resultIdString, tagIds);
      expect(getResultMock).toHaveBeenCalledWith(uid, resultIdString);
      expect(getUserPartialMock).toHaveBeenCalledWith(uid, "update tags", [
        "tags",
      ]);
      expect(checkIfTagPbMock).toHaveBeenCalledWith(uid, partialUser, result);
    });
    it("should apply defaults on missing data", async () => {
      //GIVEN
      const result = givenDbResult(uid);
      const partialResult = omit(
        result,
        "difficulty",
        "language",
        "funbox",
        "lazyMode",
        "punctuation",
        "numbers"
      );

      const resultIdString = result._id.toHexString();
      const tagIds = [
        new ObjectId().toHexString(),
        new ObjectId().toHexString(),
      ];
      const partialUser = { tags: [] };
      getResultMock.mockResolvedValue(partialResult);
      updateTagsMock.mockResolvedValue({} as any);
      getUserPartialMock.mockResolvedValue(partialUser as any);
      checkIfTagPbMock.mockResolvedValue([]);

      //WHEN
      const { body } = await mockApp
        .patch("/results/tags")
        .set("Authorization", `Bearer ${uid}`)
        .send({ resultId: resultIdString, tagIds })
        .expect(200);

      //THEN
      expect(body.message).toEqual("Result tags updated");
      expect(body.data).toEqual({
        tagPbs: [],
      });

      expect(updateTagsMock).toHaveBeenCalledWith(uid, resultIdString, tagIds);
      expect(getResultMock).toHaveBeenCalledWith(uid, resultIdString);
      expect(getUserPartialMock).toHaveBeenCalledWith(uid, "update tags", [
        "tags",
      ]);
      expect(checkIfTagPbMock).toHaveBeenCalledWith(uid, partialUser, {
        ...result,
        difficulty: "normal",
        language: "english",
        funbox: "none",
        lazyMode: false,
        punctuation: false,
        numbers: false,
      });
    });
    it("should fail with missing mandatory properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .patch("/results/tags")
        .set("Authorization", `Bearer ${uid}`)
        .send({})
        .expect(422);

      //THEN
      //TODO
      /*
      expect(body).toEqual({
        message: "",
        validationErrors: [],
      });
      */
    });
    it("should fail with unknownproperties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .patch("/results/tags")
        .set("Authorization", `Bearer ${uid}`)
        .send({ extra: "value" })
        .expect(422);

      //THEN
      //TODO
      /*
      expect(body).toEqual({
        message: "",
        validationErrors: [],
      });
      */
    });
  });
  describe("addResult", () => {
    //TODO improve test coverage for addResult
    const getUserMock = vi.spyOn(UserDal, "getUser");
    const updateStreakMock = vi.spyOn(UserDal, "updateStreak");
    const checkIfTagPbMock = vi.spyOn(UserDal, "checkIfTagPb");

    beforeEach(async () => {
      await enableResultsSaving(true);
      getUserMock.mockReset();
      updateStreakMock.mockReset();
      checkIfTagPbMock.mockReset();

      getUserMock.mockResolvedValue({} as any);
      updateStreakMock.mockResolvedValue(0);
      checkIfTagPbMock.mockResolvedValue([]);
    });

    it("should add result", async () => {
      //GIVEN
      getUserMock.mockResolvedValue({} as any);
      const result = givenDbResult(uid);

      //WHEN
      const { body } = await mockApp
        .post("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send({
          result: {
            acc: result.acc,
            afkDuration: 5,
            bailedOut: false,
            blindMode: false,
            charStats: result.charStats,
            chartData: result.chartData,
            consistency: result.consistency,
            difficulty: "normal",
            funbox: "none",
            hash: "hash",
            incompleteTestSeconds: 2,
            incompleteTests: [{ acc: 75, seconds: 10 }],
            keyConsistency: result.keyConsistency,
            keyDuration: [0, 3, 5],
            keySpacing: [0, 2, 4],
            language: "english",
            lazyMode: false,
            mode: result.mode,
            mode2: result.mode2,
            numbers: false,
            punctuation: false,
            rawWpm: result.rawWpm,
            restartCount: 4,
            tags: [new ObjectId().toHexString()],
            testDuration: result.testDuration,
            timestamp: result.timestamp,
            uid: result.uid,
            wpmConsistency: 55,
            wpm: result.wpm,
            stopOnLetter: false,
          },
        })
        .expect(200);
      console.log(body);

      expect(body.message).toEqual("Result saved");
      expect(body.data).toEqual(
        expect.objectContaining({
          isPb: true,
          tagPbs: [],
          xp: 0,
          dailyXpBonus: false,
          xpBreakdown: {},
          streak: 0,
        })
      );
    });
    it("should fail if result saving is disabled", async () => {
      //GIVEN
      await enableResultsSaving(false);

      //WHEN
      const { body } = await mockApp
        .post("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send({})
        .expect(503);

      //THEN
      expect(body.message).toEqual("Results are not being saved at this time.");
    });
    it("should fail without mandatory properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send({})
        .expect(422);

      //THEN
      //TODO
      //expect(body.message).toEqual("Results are not being saved at this time.");
      //expect(body.validationErrors).toEqual([]);
    });
    it("should fail with unknown properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send({ extra: "value" })
        .expect(422);

      //THEN
      //TODO
      //expect(body.message).toEqual("Results are not being saved at this time.");
      //expect(body.validationErrors).toEqual([]);
    });

    it("should fail invalid properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/results")
        .set("Authorization", `Bearer ${uid}`)
        //TODO add all properties
        .send({ acc: 25 })
        .expect(422);

      //THEN
      //TODO
      //expect(body.message).toEqual("Results are not being saved at this time.");
      //expect(body.validationErrors).toEqual([]);
    });
  });
});

async function enablePremiumFeatures(premium: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { premium: { enabled: premium } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
function givenDbResult(uid: string): MonkeyTypes.DBResult {
  return {
    _id: new ObjectId(),
    wpm: Math.random() * 100,
    rawWpm: Math.random() * 100,
    charStats: [
      Math.random() * 10,
      Math.random() * 10,
      Math.random() * 10,
      Math.random() * 10,
    ],
    acc: 80 + Math.random() * 20, //min accuracy is 75%
    mode: "time",
    mode2: "60",
    timestamp: Math.random() * 100,
    testDuration: Math.random() * 100,
    consistency: Math.random() * 100,
    keyConsistency: Math.random() * 100,
    uid,
    keySpacingStats: { average: Math.random() * 100, sd: Math.random() },
    keyDurationStats: { average: Math.random() * 100, sd: Math.random() },
    isPb: true,
    chartData: {
      wpm: [Math.random() * 100],
      raw: [Math.random() * 100],
      err: [Math.random() * 100],
    },
    name: "testName",
  };
}

async function acceptApeKeys(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    apeKeys: { acceptKeys: enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function enableResultsSaving(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    results: { savingEnabled: enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
