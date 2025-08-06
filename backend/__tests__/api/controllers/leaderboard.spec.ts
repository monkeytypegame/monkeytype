import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import _ from "lodash";
import { ObjectId } from "mongodb";
import request from "supertest";
import app from "../../../src/app";
import * as LeaderboardDal from "../../../src/dal/leaderboards";
import * as FriendDal from "../../../src/dal/friends";
import * as DailyLeaderboards from "../../../src/utils/daily-leaderboards";
import * as WeeklyXpLeaderboard from "../../../src/services/weekly-xp-leaderboard";
import * as Configuration from "../../../src/init/configuration";
import {
  mockAuthenticateWithApeKey,
  mockBearerAuthentication,
} from "../../__testData__/auth";
import { XpLeaderboardEntry } from "@monkeytype/schemas/leaderboards";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();
const uid = new ObjectId().toHexString();
const mockAuth = mockBearerAuthentication(uid);

const allModes = [
  "10",
  "25",
  "50",
  "100",
  "15",
  "30",
  "60",
  "120",
  "zen",
  "custom",
];

describe("Loaderboard Controller", () => {
  beforeEach(() => {
    mockAuth.beforeEach();
  });
  describe("get leaderboard", () => {
    const getLeaderboardMock = vi.spyOn(LeaderboardDal, "get");
    const getLeaderboardCountMock = vi.spyOn(LeaderboardDal, "getCount");
    const getFriendsUidsMock = vi.spyOn(FriendDal, "getFriendsUids");

    beforeEach(() => {
      getLeaderboardMock.mockClear();
      getLeaderboardCountMock.mockClear();
      getFriendsUidsMock.mockClear();
      getLeaderboardCountMock.mockResolvedValue(42);
    });

    it("should get for english time 60", async () => {
      //GIVEN

      const resultData = {
        count: 42,
        pageSize: 50,
        entries: [
          {
            wpm: 20,
            acc: 90,
            timestamp: 1000,
            raw: 92,
            consistency: 80,
            uid: "user1",
            name: "user1",
            discordId: "discordId",
            discordAvatar: "discordAvatar",
            rank: 1,
            badgeId: 1,
            isPremium: true,
          },
          {
            wpm: 10,
            acc: 80,
            timestamp: 1200,
            raw: 82,
            uid: "user2",
            name: "user2",
            rank: 2,
          },
        ],
      };
      const mockData = resultData.entries.map((it) => ({
        ...it,
        _id: new ObjectId(),
      }));
      getLeaderboardMock.mockResolvedValue(mockData);
      getLeaderboardCountMock.mockResolvedValue(42);

      //WHEN

      const { body } = await mockApp
        .get("/leaderboards")
        .query({ language: "english", mode: "time", mode2: "60" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Leaderboard retrieved",
        data: resultData,
      });

      expect(getLeaderboardMock).toHaveBeenCalledWith(
        "time",
        "60",
        "english",
        0,
        50,
        false,
        undefined
      );

      expect(getLeaderboardCountMock).toHaveBeenCalledWith(
        "time",
        "60",
        "english",
        undefined
      );
    });

    it("should get for english time 60 with page", async () => {
      //GIVEN
      getLeaderboardMock.mockResolvedValue([]);
      getLeaderboardCountMock.mockResolvedValue(42);
      const page = 0;
      const pageSize = 25;

      //WHEN

      const { body } = await mockApp
        .get("/leaderboards")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          page,
          pageSize,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Leaderboard retrieved",
        data: {
          count: 42,
          pageSize: 25,
          entries: [],
        },
      });

      expect(getLeaderboardMock).toHaveBeenCalledWith(
        "time",
        "60",
        "english",
        page,
        pageSize,
        false,
        undefined
      );
    });

    it("should get for friendsOnly", async () => {
      //GIVEN
      await enableFriendsFeature(true);
      getLeaderboardMock.mockResolvedValue([]);
      getFriendsUidsMock.mockResolvedValue(["uidOne", "uidTwo"]);
      getLeaderboardCountMock.mockResolvedValue(2);

      //WHEN

      const { body } = await mockApp
        .get("/leaderboards")
        .set("Authorization", `Bearer ${uid}`)
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          friendsOnly: true,
        })
        .expect(200);

      //THEN
      expect(body.data.count).toEqual(2);

      expect(getLeaderboardMock).toHaveBeenCalledWith(
        "time",
        "60",
        "english",
        0,
        50,
        false,
        ["uidOne", "uidTwo"]
      );
      expect(getLeaderboardCountMock).toHaveBeenCalledWith(
        "time",
        "60",
        "english",
        ["uidOne", "uidTwo"]
      );
    });

    describe("should get for modes", async () => {
      beforeEach(() => {
        getLeaderboardMock.mockResolvedValue([]);
      });

      const testCases = [
        { mode: "time", mode2: "15", language: "english", expectStatus: 200 },
        { mode: "time", mode2: "60", language: "english", expectStatus: 200 },
        { mode: "time", mode2: "30", language: "english", expectStatus: 404 },
        { mode: "words", mode2: "15", language: "english", expectStatus: 404 },
        { mode: "time", mode2: "15", language: "spanish", expectStatus: 404 },
      ];
      it.for(testCases)(
        `expect $expectStatus for mode $mode, mode2 $mode2, lang $language`,
        async ({ mode, mode2, language, expectStatus }) => {
          await mockApp
            .get("/leaderboards")
            .query({ language, mode, mode2 })
            .expect(expectStatus);
        }
      );
    });

    it("fails for missing query", async () => {
      const { body } = await mockApp.get("/leaderboards").expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          '"language" Required',
          '"mode" Required',
          '"mode2" Needs to be either a number, "zen" or "custom".',
        ],
      });
    });
    it("fails for invalid query", async () => {
      const { body } = await mockApp
        .get("/leaderboards")
        .query({
          language: "en?gli.sh",
          mode: "unknownMode",
          mode2: "unknownMode2",
          page: -1,
          pageSize: 500,
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          '"language" Invalid enum value. Must be a supported language',
          `"mode" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'unknownMode'`,
          '"mode2" Needs to be a number or a number represented as a string e.g. "10".',
          '"page" Number must be greater than or equal to 0',
          '"pageSize" Number must be less than or equal to 200',
        ],
      });
    });
    it("fails for unknown query", async () => {
      const { body } = await mockApp
        .get("/leaderboards")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          extra: "value",
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("fails while leaderboard is updating", async () => {
      //GIVEN
      getLeaderboardMock.mockResolvedValue(false);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
        })
        .expect(503);

      expect(body.message).toEqual(
        "Leaderboard is currently updating. Please try again in a few seconds."
      );
    });
  });

  describe("get rank", () => {
    const getLeaderboardRankMock = vi.spyOn(LeaderboardDal, "getRank");

    afterEach(() => {
      getLeaderboardRankMock.mockClear();
    });

    it("fails withouth authentication", async () => {
      await mockApp
        .get("/leaderboards/rank")
        .query({ language: "english", mode: "time", mode2: "60" })
        .expect(401);
    });

    it("should get for english time 60", async () => {
      //GIVEN

      const entryId = new ObjectId();
      const resultEntry = {
        _id: entryId,
        wpm: 10,
        acc: 80,
        timestamp: 1200,
        raw: 82,
        uid: "user2",
        name: "user2",
        rank: 2,
      };
      getLeaderboardRankMock.mockResolvedValue(resultEntry);

      //WHEN

      const { body } = await mockApp
        .get("/leaderboards/rank")
        .query({ language: "english", mode: "time", mode2: "60" })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Rank retrieved",
        data: { ...resultEntry, _id: undefined },
      });

      expect(getLeaderboardRankMock).toHaveBeenCalledWith(
        "time",
        "60",
        "english",
        uid,
        undefined
      );
    });
    it("should get with ape key", async () => {
      await acceptApeKeys(true);
      const apeKey = await mockAuthenticateWithApeKey(uid, await configuration);

      await mockApp
        .get("/leaderboards/rank")
        .query({ language: "english", mode: "time", mode2: "60" })
        .set("authorization", "ApeKey " + apeKey)
        .expect(200);
    });
    it("should get for mode", async () => {
      getLeaderboardRankMock.mockResolvedValue({} as any);
      for (const mode of ["time", "words", "quote", "zen", "custom"]) {
        const response = await mockApp
          .get("/leaderboards/rank")
          .set("Authorization", `Bearer ${uid}`)
          .query({ language: "english", mode, mode2: "custom" });
        expect(response.status, "for mode " + mode).toEqual(200);
      }
    });

    it("should get for mode2", async () => {
      getLeaderboardRankMock.mockResolvedValue({} as any);
      for (const mode2 of allModes) {
        const response = await mockApp
          .get("/leaderboards/rank")
          .set("Authorization", `Bearer ${uid}`)
          .query({ language: "english", mode: "words", mode2 });

        expect(response.status, "for mode2 " + mode2).toEqual(200);
      }
    });
    it("fails for missing query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/rank")
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          '"language" Required',
          '"mode" Required',
          '"mode2" Needs to be either a number, "zen" or "custom".',
        ],
      });
    });
    it("fails for invalid query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/rank")
        .query({
          language: "en?gli.sh",
          mode: "unknownMode",
          mode2: "unknownMode2",
        })
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          '"language" Invalid enum value. Must be a supported language',
          `"mode" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'unknownMode'`,
          '"mode2" Needs to be a number or a number represented as a string e.g. "10".',
        ],
      });
    });
    it("fails for unknown query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/rank")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          extra: "value",
        })
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("fails while leaderboard is updating", async () => {
      //GIVEN
      getLeaderboardRankMock.mockResolvedValue(false);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/rank")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
        })
        .set("Authorization", `Bearer ${uid}`)
        .expect(503);

      expect(body.message).toEqual(
        "Leaderboard is currently updating. Please try again in a few seconds."
      );
    });
  });

  describe("get daily leaderboard", () => {
    const getDailyLeaderboardMock = vi.spyOn(
      DailyLeaderboards,
      "getDailyLeaderboard"
    );
    const getFriendsUidsMock = vi.spyOn(FriendDal, "getFriendsUids");

    const getResultMock = vi.fn();
    const getCountMock = vi.fn();
    const getMinWpmMock = vi.fn();

    beforeEach(async () => {
      [
        getDailyLeaderboardMock,
        getFriendsUidsMock,
        getResultMock,
        getCountMock,
        getMinWpmMock,
      ].forEach((it) => it.mockClear());

      vi.useFakeTimers();
      vi.setSystemTime(1722606812000);
      await dailyLeaderboardEnabled(true);

      getDailyLeaderboardMock.mockReturnValue({
        getResults: getResultMock,
        getCount: getCountMock,
        getMinWpm: getMinWpmMock,
      } as any);

      getResultMock.mockResolvedValue([]);
      getCountMock.mockResolvedValue(0);
      getMinWpmMock.mockResolvedValue(0);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should get for english time 60", async () => {
      //GIVEN
      const lbConf = (await configuration).dailyLeaderboards;
      const premiumEnabled = (await configuration).users.premium.enabled;

      const resultData = {
        minWpm: 10,
        entries: [
          {
            name: "user1",
            rank: 1,
            wpm: 20,
            acc: 90,
            timestamp: 1000,
            raw: 92,
            consistency: 80,
            uid: "user1",
            discordId: "discordId",
            discordAvatar: "discordAvatar",
          },
          {
            wpm: 10,
            rank: 2,
            acc: 80,
            timestamp: 1200,
            raw: 82,
            consistency: 72,
            uid: "user2",
            name: "user2",
          },
        ],
      };

      getResultMock.mockResolvedValue(resultData);
      getCountMock.mockResolvedValue(2);
      getMinWpmMock.mockResolvedValue(10);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/daily")
        .query({ language: "english", mode: "time", mode2: "60" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Daily leaderboard retrieved",
        data: {
          count: 2,
          pageSize: 50,
          minWpm: 10,
          entries: resultData,
        },
      });

      expect(getDailyLeaderboardMock).toHaveBeenCalledWith(
        "english",
        "time",
        "60",
        lbConf,
        -1
      );

      expect(getResultMock).toHaveBeenCalledWith(
        0,
        50,
        lbConf,
        premiumEnabled,
        undefined
      );
    });

    it("should get for english time 60 for yesterday", async () => {
      //GIVEN
      const lbConf = (await configuration).dailyLeaderboards;

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/daily")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          daysBefore: 1,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Daily leaderboard retrieved",
        data: {
          entries: [],
          count: 0,
          pageSize: 50,
          minWpm: 0,
        },
      });

      expect(getDailyLeaderboardMock).toHaveBeenCalledWith(
        "english",
        "time",
        "60",
        lbConf,
        1722470400000
      );
    });
    it("should get for english time 60 with page and pageSize", async () => {
      //GIVEN
      const lbConf = (await configuration).dailyLeaderboards;
      const premiumEnabled = (await configuration).users.premium.enabled;
      const page = 2;
      const pageSize = 25;

      getResultMock.mockResolvedValue([]);
      getCountMock.mockResolvedValue(0);
      getMinWpmMock.mockResolvedValue(0);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/daily")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          page,
          pageSize,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Daily leaderboard retrieved",
        data: {
          entries: [],
          count: 0,
          pageSize,
          minWpm: 0,
        },
      });

      expect(getDailyLeaderboardMock).toHaveBeenCalledWith(
        "english",
        "time",
        "60",
        lbConf,
        -1
      );

      expect(getResultMock).toHaveBeenCalledWith(
        page,
        pageSize,
        lbConf,
        premiumEnabled,
        undefined
      );
    });

    it("fails for daysBefore not one", async () => {
      const { body } = await mockApp
        .get("/leaderboards/daily")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          daysBefore: 2,
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ['"daysBefore" Invalid literal value, expected 1'],
      });
    });

    it("fails if daily leaderboards are disabled", async () => {
      await dailyLeaderboardEnabled(false);

      const { body } = await mockApp.get("/leaderboards/daily").expect(503);

      expect(body.message).toEqual(
        "Daily leaderboards are not available at this time."
      );
    });

    it("should get for mode", async () => {
      for (const mode of ["time", "words", "quote", "zen", "custom"]) {
        const response = await mockApp
          .get("/leaderboards/daily")
          .query({ language: "english", mode, mode2: "custom" });
        expect(response.status, "for mode " + mode).toEqual(200);
      }
    });

    it("should get for friends", async () => {
      //GIVEN
      const lbConf = (await configuration).dailyLeaderboards;
      const premiumEnabled = (await configuration).users.premium.enabled;
      await enableFriendsFeature(true);
      const friends = [
        new ObjectId().toHexString(),
        new ObjectId().toHexString(),
      ];
      getFriendsUidsMock.mockResolvedValue(friends);

      //WHEN
      await mockApp
        .get("/leaderboards/daily")
        .set("Authorization", `Bearer ${uid}`)
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          friendsOnly: true,
        })
        .expect(200);

      //THEN

      expect(getDailyLeaderboardMock).toHaveBeenCalledWith(
        "english",
        "time",
        "60",
        lbConf,
        -1
      );

      expect(getResultMock).toHaveBeenCalledWith(
        0,
        50,
        lbConf,
        premiumEnabled,
        friends
      );
    });

    it("should get for mode2", async () => {
      for (const mode2 of allModes) {
        const response = await mockApp
          .get("/leaderboards/daily")
          .query({ language: "english", mode: "words", mode2 });

        expect(response.status, "for mode2 " + mode2).toEqual(200);
      }
    });
    it("fails for missing query", async () => {
      const { body } = await mockApp.get("/leaderboards").expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          '"language" Required',
          '"mode" Required',
          '"mode2" Needs to be either a number, "zen" or "custom".',
        ],
      });
    });
    it("fails for invalid query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/daily")
        .query({
          language: "en?gli.sh",
          mode: "unknownMode",
          mode2: "unknownMode2",
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          '"language" Invalid enum value. Must be a supported language',
          `"mode" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'unknownMode'`,
          '"mode2" Needs to be a number or a number represented as a string e.g. "10".',
        ],
      });
    });
    it("fails for unknown query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/daily")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          extra: "value",
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("fails while leaderboard is missing", async () => {
      //GIVEN
      getDailyLeaderboardMock.mockReturnValue(null);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/daily")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
        })
        .expect(404);

      expect(body.message).toEqual(
        "There is no daily leaderboard for this mode"
      );
    });
  });

  describe("get daily leaderboard rank", () => {
    const getDailyLeaderboardMock = vi.spyOn(
      DailyLeaderboards,
      "getDailyLeaderboard"
    );

    const getRankMock = vi.fn();

    beforeEach(async () => {
      getDailyLeaderboardMock.mockClear();
      getRankMock.mockClear();

      getDailyLeaderboardMock.mockReturnValue({
        getRank: getRankMock,
      } as any);

      vi.useFakeTimers();
      vi.setSystemTime(1722606812000);
      await dailyLeaderboardEnabled(true);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("fails withouth authentication", async () => {
      await mockApp
        .get("/leaderboards/daily/rank")

        .query({ language: "english", mode: "time", mode2: "60" })
        .expect(401);
    });
    it("should get for english time 60", async () => {
      //GIVEN
      const lbConf = (await configuration).dailyLeaderboards;
      const rankData = {
        min: 100,
        count: 1000,
        rank: 12,
        entry: {
          wpm: 10,
          rank: 2,
          acc: 80,
          timestamp: 1200,
          raw: 82,
          consistency: 72,
          uid: "user2",
          name: "user2",
        },
      };

      getRankMock.mockResolvedValue(rankData);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/daily/rank")
        .set("Authorization", `Bearer ${uid}`)
        .query({ language: "english", mode: "time", mode2: "60" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Daily leaderboard rank retrieved",
        data: rankData,
      });

      expect(getDailyLeaderboardMock).toHaveBeenCalledWith(
        "english",
        "time",
        "60",
        lbConf,
        -1
      );

      expect(getRankMock).toHaveBeenCalledWith(uid, lbConf);
    });
    it("fails if daily leaderboards are disabled", async () => {
      await dailyLeaderboardEnabled(false);

      const { body } = await mockApp
        .get("/leaderboards/daily/rank")
        .set("Authorization", `Bearer ${uid}`)
        .expect(503);

      expect(body.message).toEqual(
        "Daily leaderboards are not available at this time."
      );
    });
    it("should get for mode", async () => {
      for (const mode of ["time", "words", "quote", "zen", "custom"]) {
        const response = await mockApp
          .get("/leaderboards/daily/rank")
          .set("Authorization", `Bearer ${uid}`)
          .query({ language: "english", mode, mode2: "custom" });
        expect(response.status, "for mode " + mode).toEqual(200);
      }
    });
    it("should get for mode2", async () => {
      for (const mode2 of allModes) {
        const response = await mockApp
          .get("/leaderboards/daily/rank")
          .set("Authorization", `Bearer ${uid}`)
          .query({ language: "english", mode: "words", mode2 });

        expect(response.status, "for mode2 " + mode2).toEqual(200);
      }
    });
    it("fails for missing query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/daily/rank")
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          '"language" Required',
          '"mode" Required',
          '"mode2" Needs to be either a number, "zen" or "custom".',
        ],
      });
    });
    it("fails for invalid query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/daily/rank")
        .query({
          language: "en?gli.sh",
          mode: "unknownMode",
          mode2: "unknownMode2",
        })
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          '"language" Invalid enum value. Must be a supported language',
          `"mode" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'unknownMode'`,
          '"mode2" Needs to be a number or a number represented as a string e.g. "10".',
        ],
      });
    });
    it("fails for unknown query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/daily/rank")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          extra: "value",
        })
        .set("Authorization", `Bearer ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("fails while leaderboard is missing", async () => {
      //GIVEN
      getDailyLeaderboardMock.mockReturnValue(null);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/daily/rank")
        .set("Authorization", `Bearer ${uid}`)
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
        })
        .expect(404);

      expect(body.message).toEqual(
        "There is no daily leaderboard for this mode"
      );
    });
  });

  describe("get xp weekly leaderboard", () => {
    const getXpWeeklyLeaderboardMock = vi.spyOn(WeeklyXpLeaderboard, "get");
    const getResultMock = vi.fn();
    const getCountMock = vi.fn();

    beforeEach(async () => {
      getXpWeeklyLeaderboardMock.mockClear();
      getResultMock.mockClear();
      getCountMock.mockClear();

      vi.useFakeTimers();
      vi.setSystemTime(1722606812000);
      await weeklyLeaderboardEnabled(true);

      getXpWeeklyLeaderboardMock.mockReturnValue({
        getResults: getResultMock,
        getCount: getCountMock,
      } as any);

      getResultMock.mockResolvedValue([]);
      getCountMock.mockResolvedValue(0);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should get", async () => {
      //GIVEN
      const lbConf = (await configuration).leaderboards.weeklyXp;

      const resultData: XpLeaderboardEntry[] = [
        {
          totalXp: 100,
          rank: 1,
          timeTypedSeconds: 100,
          uid: "user1",
          name: "user1",
          discordId: "discordId",
          discordAvatar: "discordAvatar",
          lastActivityTimestamp: 1000,
        },
        {
          totalXp: 75,
          rank: 2,
          timeTypedSeconds: 200,
          uid: "user2",
          name: "user2",
          discordId: "discordId2",
          discordAvatar: "discordAvatar2",
          lastActivityTimestamp: 2000,
        },
      ];

      getResultMock.mockResolvedValue(resultData);
      getCountMock.mockResolvedValue(2);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/xp/weekly")
        .query({})
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Weekly xp leaderboard retrieved",
        data: {
          entries: resultData,
          count: 2,
          pageSize: 50,
        },
      });

      expect(getXpWeeklyLeaderboardMock).toHaveBeenCalledWith(lbConf, -1);

      expect(getResultMock).toHaveBeenCalledWith(0, 50, lbConf, false);
    });

    it("should get for last week", async () => {
      //GIVEN
      const lbConf = (await configuration).leaderboards.weeklyXp;

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/xp/weekly")
        .query({
          weeksBefore: 1,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Weekly xp leaderboard retrieved",
        data: {
          count: 0,
          entries: [],
          pageSize: 50,
        },
      });

      expect(getXpWeeklyLeaderboardMock).toHaveBeenCalledWith(
        lbConf,
        1721606400000
      );
    });

    it("should get with skip and limit", async () => {
      //GIVEN
      const lbConf = (await configuration).leaderboards.weeklyXp;
      const page = 2;
      const pageSize = 25;

      getResultMock.mockResolvedValue([]);
      getCountMock.mockResolvedValue(0);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/xp/weekly")
        .query({
          page,
          pageSize,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Weekly xp leaderboard retrieved",
        data: {
          entries: [],
          count: 0,
          pageSize,
        },
      });

      expect(getXpWeeklyLeaderboardMock).toHaveBeenCalledWith(lbConf, -1);

      expect(getResultMock).toHaveBeenCalledWith(page, pageSize, lbConf, false);
    });

    it("fails if daily leaderboards are disabled", async () => {
      await weeklyLeaderboardEnabled(false);

      const { body } = await mockApp.get("/leaderboards/xp/weekly").expect(503);

      expect(body.message).toEqual(
        "Weekly XP leaderboards are not available at this time."
      );
    });

    it("fails for weeksBefore not one", async () => {
      const { body } = await mockApp
        .get("/leaderboards/xp/weekly")
        .query({
          weeksBefore: 2,
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ['"weeksBefore" Invalid literal value, expected 1'],
      });
    });
    it("fails for unknown query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/xp/weekly")
        .query({
          extra: "value",
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("fails while leaderboard is missing", async () => {
      //GIVEN
      getXpWeeklyLeaderboardMock.mockReturnValue(null);

      //WHEN
      const { body } = await mockApp.get("/leaderboards/xp/weekly").expect(404);

      expect(body.message).toEqual("XP leaderboard for this week not found.");
    });
  });

  describe("get xp weekly leaderboard rank", () => {
    const getXpWeeklyLeaderboardMock = vi.spyOn(WeeklyXpLeaderboard, "get");
    const getRankMock = vi.fn();

    beforeEach(async () => {
      getXpWeeklyLeaderboardMock.mockClear();
      getRankMock.mockClear();

      await weeklyLeaderboardEnabled(true);
      vi.useFakeTimers();
      vi.setSystemTime(1722606812000);

      getXpWeeklyLeaderboardMock.mockReturnValue({
        getRank: getRankMock,
      } as any);
    });

    it("fails withouth authentication", async () => {
      await mockApp.get("/leaderboards/xp/weekly/rank").expect(401);
    });

    it("should get", async () => {
      //GIVEN
      const lbConf = (await configuration).leaderboards.weeklyXp;

      const resultData: XpLeaderboardEntry = {
        totalXp: 100,
        rank: 1,
        timeTypedSeconds: 100,
        uid: "user1",
        name: "user1",
        discordId: "discordId",
        discordAvatar: "discordAvatar",
        lastActivityTimestamp: 1000,
      };

      getRankMock.mockResolvedValue(resultData);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/xp/weekly/rank")
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Weekly xp leaderboard rank retrieved",
        data: resultData,
      });

      expect(getXpWeeklyLeaderboardMock).toHaveBeenCalledWith(lbConf, -1);

      expect(getRankMock).toHaveBeenCalledWith(uid, lbConf);
    });

    it("should get for last week", async () => {
      //GIVEN
      const lbConf = (await configuration).leaderboards.weeklyXp;

      const resultData: XpLeaderboardEntry = {
        totalXp: 100,
        rank: 1,
        timeTypedSeconds: 100,
        uid: "user1",
        name: "user1",
        discordId: "discordId",
        discordAvatar: "discordAvatar",
        lastActivityTimestamp: 1000,
      };
      getRankMock.mockResolvedValue(resultData);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/xp/weekly/rank")
        .query({ weeksBefore: 1 })
        .set("Authorization", `Bearer ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Weekly xp leaderboard rank retrieved",
        data: resultData,
      });

      expect(getXpWeeklyLeaderboardMock).toHaveBeenCalledWith(
        lbConf,
        1721606400000
      );

      expect(getRankMock).toHaveBeenCalledWith(uid, lbConf);
    });
    it("fails if daily leaderboards are disabled", async () => {
      await weeklyLeaderboardEnabled(false);

      const { body } = await mockApp
        .get("/leaderboards/xp/weekly/rank")
        .set("Authorization", `Bearer ${uid}`)
        .expect(503);

      expect(body.message).toEqual(
        "Weekly XP leaderboards are not available at this time."
      );
    });

    it("fails for weeksBefore not one", async () => {
      const { body } = await mockApp
        .get("/leaderboards/xp/weekly/rank")
        .set("Authorization", `Bearer ${uid}`)
        .query({
          weeksBefore: 2,
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ['"weeksBefore" Invalid literal value, expected 1'],
      });
    });

    it("fails for unknown query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/xp/weekly/rank")
        .set("Authorization", `Bearer ${uid}`)
        .query({
          extra: "value",
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });

    it("fails while leaderboard is missing", async () => {
      //GIVEN
      getXpWeeklyLeaderboardMock.mockReturnValue(null);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/xp/weekly/rank")
        .set("Authorization", `Bearer ${uid}`)
        .expect(404);

      expect(body.message).toEqual("XP leaderboard for this week not found.");
    });
  });
});

async function acceptApeKeys(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    apeKeys: { acceptKeys: enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function dailyLeaderboardEnabled(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    dailyLeaderboards: { enabled: enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
async function weeklyLeaderboardEnabled(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    leaderboards: { weeklyXp: { enabled } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function enableFriendsFeature(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    friends: { enabled: { enabled } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
