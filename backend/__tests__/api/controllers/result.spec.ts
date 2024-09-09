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
import { enableRateLimitExpects } from "../../__testData__/rate-limit";
const uid = "123456";

const mockDecodedToken: DecodedIdToken = {
  uid,
  email: "newuser@mail.com",
  iat: 0,
} as DecodedIdToken;

const mockApp = request(app);

const configuration = Configuration.getCachedConfiguration();
enableRateLimitExpects();

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
      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ['"limit" Number must be less than or equal to 1000'],
      });
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
      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should get results with legacy values", async () => {
      //GIVEN
      const resultOne = givenDbResult(uid, {
        charStats: undefined,
        incorrectChars: 5,
        correctChars: 12,
      });
      const resultTwo = givenDbResult(uid, {
        charStats: undefined,
        incorrectChars: 7,
        correctChars: 15,
      });
      resultMock.mockResolvedValue([resultOne, resultTwo]);

      //WHEN
      const { body } = await mockApp
        .get("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(200);

      //THEN

      expect(body.message).toEqual("Results retrieved");
      expect(body.data[0]).toMatchObject({
        _id: resultOne._id.toHexString(),
        charStats: [12, 5, 0, 0],
      });
      expect(body.data[0]).not.toHaveProperty("correctChars");
      expect(body.data[0]).not.toHaveProperty("incorrectChars");

      expect(body.data[1]).toMatchObject({
        _id: resultTwo._id.toHexString(),
        charStats: [15, 7, 0, 0],
      });
      expect(body.data[1]).not.toHaveProperty("correctChars");
      expect(body.data[1]).not.toHaveProperty("incorrectChars");
    });
    it("should be rate limited", async () => {
      await expect(
        mockApp.get("/results").set("Authorization", `Bearer ${uid}`)
      ).toBeRateLimited({ max: 60, windowMs: 60 * 60 * 1000 });
    });
    it("should be rate limited for ape keys", async () => {
      //GIVEN
      await acceptApeKeys(true);
      const apeKey = await mockAuthenticateWithApeKey(uid, await configuration);

      //WHEN
      await expect(
        mockApp.get("/results").set("Authorization", `ApeKey ${apeKey}`)
      ).toBeRateLimited({ max: 30, windowMs: 24 * 60 * 60 * 1000 });
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
      const result = givenDbResult(uid);
      getLastResultMock.mockResolvedValue(result);

      //WHEN
      await mockApp
        .get("/results/last")
        .set("Authorization", `ApeKey ${apeKey}`)
        .send()
        .expect(200);
    });
    it("should get last result with legacy values", async () => {
      //GIVEN
      const result = givenDbResult(uid, {
        charStats: undefined,
        incorrectChars: 5,
        correctChars: 12,
      });
      getLastResultMock.mockResolvedValue(result);

      //WHEN
      const { body } = await mockApp
        .get("/results/last")
        .set("Authorization", `Bearer ${uid}`)
        .send()
        .expect(200);

      //THEN
      expect(body.message).toEqual("Result retrieved");
      expect(body.data).toMatchObject({
        _id: result._id.toHexString(),
        charStats: [12, 5, 0, 0],
      });
      expect(body.data).not.toHaveProperty("correctChars");
      expect(body.data).not.toHaveProperty("incorrectChars");
    });
    it("should rate limit get last result with ape key", async () => {
      //GIVEN
      const result = givenDbResult(uid, {
        charStats: undefined,
        incorrectChars: 5,
        correctChars: 12,
      });
      getLastResultMock.mockResolvedValue(result);
      await acceptApeKeys(true);
      const apeKey = await mockAuthenticateWithApeKey(uid, await configuration);

      //WHEN
      await expect(
        mockApp.get("/results/last").set("Authorization", `ApeKey ${apeKey}`)
      ).toBeRateLimited({ max: 30, windowMs: 60 * 1000 }); //should use defaultApeRateLimit
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
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"tagIds" Required', '"resultId" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .patch("/results/tags")
        .set("Authorization", `Bearer ${uid}`)
        .send({ extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"tagIds" Required',
          '"resultId" Required',
          "Unrecognized key(s) in object: 'extra'",
        ],
      });
    });
  });
  describe("addResult", () => {
    //TODO improve test coverage for addResult
    const insertedId = new ObjectId();
    const getUserMock = vi.spyOn(UserDal, "getUser");
    const updateStreakMock = vi.spyOn(UserDal, "updateStreak");
    const checkIfTagPbMock = vi.spyOn(UserDal, "checkIfTagPb");
    const addResultMock = vi.spyOn(ResultDal, "addResult");

    beforeEach(async () => {
      await enableResultsSaving(true);

      [getUserMock, updateStreakMock, checkIfTagPbMock, addResultMock].forEach(
        (it) => it.mockReset()
      );

      getUserMock.mockResolvedValue({ name: "bob" } as any);
      updateStreakMock.mockResolvedValue(0);
      checkIfTagPbMock.mockResolvedValue([]);
      addResultMock.mockResolvedValue({ insertedId });
    });

    it("should add result", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send({
          result: {
            acc: 86,
            afkDuration: 5,
            bailedOut: false,
            blindMode: false,
            charStats: [100, 2, 3, 5],
            chartData: { wpm: [1, 2, 3], raw: [50, 55, 56], err: [0, 2, 0] },
            consistency: 23.5,
            difficulty: "normal",
            funbox: "none",
            hash: "hash",
            incompleteTestSeconds: 2,
            incompleteTests: [{ acc: 75, seconds: 10 }],
            keyConsistency: 12,
            keyDuration: [0, 3, 5],
            keySpacing: [0, 2, 4],
            language: "english",
            lazyMode: false,
            mode: "time",
            mode2: "15",
            numbers: false,
            punctuation: false,
            rawWpm: 99,
            restartCount: 4,
            tags: ["tagOneId", "tagTwoId"],
            testDuration: 15.1,
            timestamp: 1000,
            uid,
            wpmConsistency: 55,
            wpm: 80,
            stopOnLetter: false,
            //new required
            charTotal: 5,
            keyOverlap: 7,
            lastKeyToEnd: 9,
            startToFirstKey: 11,
          },
        })
        .expect(200);

      expect(body.message).toEqual("Result saved");
      expect(body.data).toEqual({
        isPb: true,
        tagPbs: [],
        xp: 0,
        dailyXpBonus: false,
        xpBreakdown: {},
        streak: 0,
        insertedId: insertedId.toHexString(),
      });

      expect(addResultMock).toHaveBeenCalledWith(
        uid,
        expect.objectContaining({
          acc: 86,
          afkDuration: 5,
          charStats: [100, 2, 3, 5],
          chartData: {
            err: [0, 2, 0],
            raw: [50, 55, 56],
            wpm: [1, 2, 3],
          },
          consistency: 23.5,
          incompleteTestSeconds: 2,
          isPb: true,
          keyConsistency: 12,
          keyDurationStats: {
            average: 2.67,
            sd: 2.05,
          },
          keySpacingStats: {
            average: 2,
            sd: 1.63,
          },
          mode: "time",
          mode2: "15",
          name: "bob",
          rawWpm: 99,
          restartCount: 4,
          tags: ["tagOneId", "tagTwoId"],
          testDuration: 15.1,
          uid: "123456",
          wpm: 80,
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
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"result" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/results")
        .set("Authorization", `Bearer ${uid}`)
        .send({
          result: {
            acc: 86,
            afkDuration: 5,
            bailedOut: false,
            blindMode: false,
            charStats: [100, 2, 3, 5],
            chartData: { wpm: [1, 2, 3], raw: [50, 55, 56], err: [0, 2, 0] },
            consistency: 23.5,
            difficulty: "normal",
            funbox: "none",
            hash: "hash",
            incompleteTestSeconds: 2,
            incompleteTests: [{ acc: 75, seconds: 10 }],
            keyConsistency: 12,
            keyDuration: [0, 3, 5],
            keySpacing: [0, 2, 4],
            language: "english",
            lazyMode: false,
            mode: "time",
            mode2: "15",
            numbers: false,
            punctuation: false,
            rawWpm: 99,
            restartCount: 4,
            tags: ["tagOneId", "tagTwoId"],
            testDuration: 15.1,
            timestamp: 1000,
            uid,
            wpmConsistency: 55,
            wpm: 80,
            stopOnLetter: false,
            //new required
            charTotal: 5,
            keyOverlap: 7,
            lastKeyToEnd: 9,
            startToFirstKey: 11,
            extra2: "value",
          },
          extra: "value",
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          `"result" Unrecognized key(s) in object: 'extra2'`,
          "Unrecognized key(s) in object: 'extra'",
        ],
      });
    });

    it("should fail invalid properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/results")
        .set("Authorization", `Bearer ${uid}`)
        //TODO add all properties
        .send({ result: { acc: 25 } })
        .expect(422);

      //THEN
      /*
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
        ],
      });
      */
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
function givenDbResult(
  uid: string,
  customize?: Partial<MonkeyTypes.DBResult>
): MonkeyTypes.DBResult {
  return {
    _id: new ObjectId(),
    wpm: Math.random() * 100,
    rawWpm: Math.random() * 100,
    charStats: [
      Math.round(Math.random() * 10),
      Math.round(Math.random() * 10),
      Math.round(Math.random() * 10),
      Math.round(Math.random() * 10),
    ],
    acc: 80 + Math.random() * 20, //min accuracy is 75%
    mode: "time",
    mode2: "60",
    timestamp: Math.round(Math.random() * 100),
    testDuration: 1 + Math.random() * 100,
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
    ...customize,
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
