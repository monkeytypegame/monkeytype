import _ from "lodash";
import { ObjectId } from "mongodb";
import request from "supertest";
import app from "../../../src/app";
import * as LeaderboardDal from "../../../src/dal/leaderboards";
import * as DailyLeaderboards from "../../../src/utils/daily-leaderboards";
import * as Configuration from "../../../src/init/configuration";
import { mockAuthenticateWithApeKey } from "../../__testData__/auth";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();
const uid = new ObjectId().toHexString();

describe("Loaderboard Controller", () => {
  describe("get leaderboard", () => {
    const getLeaderboardMock = vi.spyOn(LeaderboardDal, "get");

    afterEach(() => {
      getLeaderboardMock.mockReset();
    });

    it("gets for english time 60", async () => {
      //GIVEN

      const resultData = [
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
      ];
      const mockData = resultData.map((it) => ({ ...it, _id: new ObjectId() }));
      getLeaderboardMock.mockResolvedValue(mockData);

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
        NaN,
        50
      );
    });

    it("gets for english time 60 with skip and limit", async () => {
      //GIVEN
      getLeaderboardMock.mockResolvedValue([]);
      const skip = 23;
      const limit = 42;

      //WHEN

      const { body } = await mockApp
        .get("/leaderboards")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          skip,
          limit,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Leaderboard retrieved",
        data: [],
      });

      expect(getLeaderboardMock).toHaveBeenCalledWith(
        "time",
        "60",
        "english",
        skip,
        limit
      );
    });

    it("gets for mode", async () => {
      getLeaderboardMock.mockResolvedValue([]);
      for (const mode of ["time", "words", "quote", "zen", "custom"]) {
        const response = await mockApp
          .get("/leaderboards")
          .query({ language: "english", mode, mode2: "custom" });
        expect(response.status, "for mode " + mode).toEqual(200);
      }
    });

    it("gets for mode2", async () => {
      getLeaderboardMock.mockResolvedValue([]);
      for (const mode2 of [
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
      ]) {
        const response = await mockApp
          .get("/leaderboards")
          .query({ language: "english", mode: "words", mode2 });

        expect(response.status, "for mode2 " + mode2).toEqual(200);
      }
    });
    it("fails for missing query", async () => {
      const { body } = await mockApp.get("/leaderboards").expect(422);

      //TODO
      /*expect(body).toEqual({
        message: "Invalid query",
        validationErrors: [
          '"language" Required',
          '"mode" Required',
          '"mode2" Needs to be either a number, "zen" or "custom."',
        ],
      });*/
    });
    it("fails for invalid query", async () => {
      const { body } = await mockApp
        .get("/leaderboards")
        .query({
          language: "en?gli.sh",
          mode: "unknownMode",
          mode2: "unknownMode2",
          skip: -1,
          limit: 100,
        })
        .expect(422);

      //TODO
      /*expect(body).toEqual({
        message: "Invalid query",
        validationErrors: [
          '"language" Invalid',
          `"mode" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'unknownMode'`,
          '"mode2" Needs to be either a number, "zen" or "custom."',
        ],
      });
      */
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

      //TODO
      /*
      expect(body).toEqual({
        message: "Invalid query",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
      */
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

      expect(body).toEqual({
        data: null,
        message:
          "Leaderboard is currently updating. Please try again in a few seconds.",
      });
    });
  });

  describe("get rank", () => {
    const getLeaderboardRankMock = vi.spyOn(LeaderboardDal, "getRank");

    afterEach(() => {
      getLeaderboardRankMock.mockReset();
    });

    it("fails withouth authentication", async () => {
      await mockApp
        .get("/leaderboards/rank")
        .query({ language: "english", mode: "time", mode2: "60" })
        .expect(401);
    });

    it("gets for english time 60", async () => {
      //GIVEN

      const entryId = new ObjectId();
      const resultEntry = {
        _id: entryId.toHexString(),
        wpm: 10,
        acc: 80,
        timestamp: 1200,
        raw: 82,
        uid: "user2",
        name: "user2",
        rank: 2,
      };
      getLeaderboardRankMock.mockResolvedValue({
        count: 1000,
        rank: 50,
        entry: { ...resultEntry, _id: entryId },
      });

      //WHEN

      const { body } = await mockApp
        .get("/leaderboards/rank")
        .query({ language: "english", mode: "time", mode2: "60" })
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Rank retrieved",
        data: {
          count: 1000,
          rank: 50,
          entry: resultEntry,
        },
      });

      expect(getLeaderboardRankMock).toHaveBeenCalledWith(
        "time",
        "60",
        "english",
        uid
      );
    });
    it("gets with ape key", async () => {
      await acceptApeKeys(true);
      const apeKey = await mockAuthenticateWithApeKey(uid, await configuration);

      await mockApp
        .get("/leaderboards/rank")
        .query({ language: "english", mode: "time", mode2: "60" })
        .set("authorization", "ApeKey " + apeKey)
        .expect(200);
    });
    it("gets for mode", async () => {
      getLeaderboardRankMock.mockResolvedValue({} as any);
      for (const mode of ["time", "words", "quote", "zen", "custom"]) {
        const response = await mockApp
          .get("/leaderboards/rank")
          .set("authorization", `Uid ${uid}`)
          .query({ language: "english", mode, mode2: "custom" });
        expect(response.status, "for mode " + mode).toEqual(200);
      }
    });

    it("gets for mode2", async () => {
      getLeaderboardRankMock.mockResolvedValue({} as any);
      for (const mode2 of [
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
      ]) {
        const response = await mockApp
          .get("/leaderboards/rank")
          .set("authorization", `Uid ${uid}`)
          .query({ language: "english", mode: "words", mode2 });

        expect(response.status, "for mode2 " + mode2).toEqual(200);
      }
    });
    it("fails for missing query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/rank")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //TODO
      /*expect(body).toEqual({
          message: "Invalid query",
          validationErrors: [
            '"language" Required',
            '"mode" Required',
            '"mode2" Needs to be either a number, "zen" or "custom."',
          ],
        });*/
    });
    it("fails for invalid query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/rank")
        .query({
          language: "en?gli.sh",
          mode: "unknownMode",
          mode2: "unknownMode2",
        })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //TODO
      /*expect(body).toEqual({
          message: "Invalid query",
          validationErrors: [
            '"language" Invalid',
            `"mode" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'unknownMode'`,
            '"mode2" Needs to be either a number, "zen" or "custom."',
          ],
        });
        */
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
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //TODO
      /*
        expect(body).toEqual({
          message: "Invalid query",
          validationErrors: ["Unrecognized key(s) in object: 'extra'"],
        });
        */
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
        .set("authorization", `Uid ${uid}`)
        .expect(503);

      expect(body).toEqual({
        data: null,
        message:
          "Leaderboard is currently updating. Please try again in a few seconds.",
      });
    });
  });

  describe("get daily leaderboard", () => {
    const getDailyLeaderboardMock = vi.spyOn(
      DailyLeaderboards,
      "getDailyLeaderboard"
    );

    beforeEach(async () => {
      vi.useFakeTimers();
      vi.setSystemTime(1722606812000);
      await dailyLeaderboardEnabled(true);

      getDailyLeaderboardMock.mockReturnValue({
        getResults: () => Promise.resolve([]),
      } as any);
    });

    afterEach(() => {
      getDailyLeaderboardMock.mockReset();
      vi.useRealTimers();
    });

    it("gets for english time 60", async () => {
      //GIVEN
      const lbConf = (await configuration).dailyLeaderboards;
      const premiumEnabled = (await configuration).users.premium.enabled;

      const resultData: DailyLeaderboards.LbEntryWithRank[] = [
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
      ];

      const getResultMock = vi.fn();
      getResultMock.mockResolvedValue(resultData);
      getDailyLeaderboardMock.mockReturnValue({
        getResults: getResultMock,
      } as any);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/daily")
        .query({ language: "english", mode: "time", mode2: "60" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Daily leaderboard retrieved",
        data: resultData,
      });

      expect(getDailyLeaderboardMock).toHaveBeenCalledWith(
        "english",
        "time",
        "60",
        lbConf,
        -1
      );

      expect(getResultMock).toHaveBeenCalledWith(0, 49, lbConf, premiumEnabled);
    });

    it("gets for english time 60 for yesterday", async () => {
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
        data: [],
      });

      expect(getDailyLeaderboardMock).toHaveBeenCalledWith(
        "english",
        "time",
        "60",
        lbConf,
        1722470400000
      );
    });

    it("gets for english time 60 with skip and limit", async () => {
      //GIVEN
      const lbConf = (await configuration).dailyLeaderboards;
      const premiumEnabled = (await configuration).users.premium.enabled;
      const limit = 23;
      const skip = 42;

      const getResultMock = vi.fn();
      getResultMock.mockResolvedValue([]);
      getDailyLeaderboardMock.mockReturnValue({
        getResults: getResultMock,
      } as any);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/daily")
        .query({
          language: "english",
          mode: "time",
          mode2: "60",
          skip,
          limit,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Daily leaderboard retrieved",
        data: [],
      });

      expect(getDailyLeaderboardMock).toHaveBeenCalledWith(
        "english",
        "time",
        "60",
        lbConf,
        -1
      );

      expect(getResultMock).toHaveBeenCalledWith(
        skip,
        skip + limit - 1,
        lbConf,
        premiumEnabled
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

      //TODO
      /*
      expect(body).toEqual(
        
      );*/
    });

    it("fails if daily leaderboards are disabled", async () => {
      await dailyLeaderboardEnabled(false);

      const { body } = await mockApp.get("/leaderboards/daily").expect(503);

      expect(body.message).toEqual(
        "Daily leaderboards are not available at this time."
      );
    });

    it("gets for mode", async () => {
      for (const mode of ["time", "words", "quote", "zen", "custom"]) {
        const response = await mockApp
          .get("/leaderboards/daily")
          .query({ language: "english", mode, mode2: "custom" });
        expect(response.status, "for mode " + mode).toEqual(200);
      }
    });

    it("gets for mode2", async () => {
      for (const mode2 of [
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
      ]) {
        const response = await mockApp
          .get("/leaderboards/daily")
          .query({ language: "english", mode: "words", mode2 });

        expect(response.status, "for mode2 " + mode2).toEqual(200);
      }
    });
    it("fails for missing query", async () => {
      const { body } = await mockApp.get("/leaderboards").expect(422);

      //TODO
      /*expect(body).toEqual({
          message: "Invalid query",
          validationErrors: [
            '"language" Required',
            '"mode" Required',
            '"mode2" Needs to be either a number, "zen" or "custom."',
          ],
        });*/
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

      //TODO
      /*expect(body).toEqual({
          message: "Invalid query",
          validationErrors: [
            '"language" Invalid',
            `"mode" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'unknownMode'`,
            '"mode2" Needs to be either a number, "zen" or "custom."',
          ],
        });
        */
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

      //TODO
      /*
        expect(body).toEqual({
          message: "Invalid query",
          validationErrors: ["Unrecognized key(s) in object: 'extra'"],
        });
        */
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

    beforeEach(async () => {
      vi.useFakeTimers();
      vi.setSystemTime(1722606812000);
      await dailyLeaderboardEnabled(true);

      getDailyLeaderboardMock.mockReturnValue({
        getRank: () => Promise.resolve({} as any),
      } as any);
    });

    afterEach(() => {
      getDailyLeaderboardMock.mockReset();
      vi.useRealTimers();
    });

    it("fails withouth authentication", async () => {
      await mockApp
        .get("/leaderboards/daily/rank")

        .query({ language: "english", mode: "time", mode2: "60" })
        .expect(401);
    });
    it("gets for english time 60", async () => {
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

      const getRankMock = vi.fn();
      getRankMock.mockResolvedValue(rankData);
      getDailyLeaderboardMock.mockReturnValue({
        getRank: getRankMock,
      } as any);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/daily/rank")
        .set("authorization", `Uid ${uid}`)
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
    it("gets for mode", async () => {
      for (const mode of ["time", "words", "quote", "zen", "custom"]) {
        const response = await mockApp
          .get("/leaderboards/daily/rank")
          .set("authorization", `Uid ${uid}`)
          .query({ language: "english", mode, mode2: "custom" });
        expect(response.status, "for mode " + mode).toEqual(200);
      }
    });

    it("gets for mode2", async () => {
      for (const mode2 of [
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
      ]) {
        const response = await mockApp
          .get("/leaderboards/daily/rank")
          .set("authorization", `Uid ${uid}`)
          .query({ language: "english", mode: "words", mode2 });

        expect(response.status, "for mode2 " + mode2).toEqual(200);
      }
    });
    it("fails for missing query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/daily/rank")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //TODO
      /*expect(body).toEqual({
          message: "Invalid query",
          validationErrors: [
            '"language" Required',
            '"mode" Required',
            '"mode2" Needs to be either a number, "zen" or "custom."',
          ],
        });*/
    });
    it("fails for invalid query", async () => {
      const { body } = await mockApp
        .get("/leaderboards/daily/rank")
        .query({
          language: "en?gli.sh",
          mode: "unknownMode",
          mode2: "unknownMode2",
          dayBefore: 2,
          limit: 100,
          skip: -1,
        })
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //TODO
      /*expect(body).toEqual({
          message: "Invalid query",
          validationErrors: [
            '"language" Invalid',
            `"mode" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'unknownMode'`,
            '"mode2" Needs to be either a number, "zen" or "custom."',
          ],
        });
        */
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
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //TODO
      /*
        expect(body).toEqual({
          message: "Invalid query",
          validationErrors: ["Unrecognized key(s) in object: 'extra'"],
        });
        */
    });
    it("fails while leaderboard is missing", async () => {
      //GIVEN
      getDailyLeaderboardMock.mockReturnValue(null);

      //WHEN
      const { body } = await mockApp
        .get("/leaderboards/daily/rank")
        .set("authorization", `Uid ${uid}`)
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

  it("GET /leaderboards/xp/weekly", async () => {
    const configSpy = vi
      .spyOn(Configuration, "getCachedConfiguration")
      .mockResolvedValue({
        leaderboards: {
          weeklyXp: {
            enabled: true,
            expirationTimeInDays: 15,
            xpRewardBrackets: [],
          },
        },
      } as any);

    const response = await mockApp
      .get("/leaderboards/xp/weekly")
      .set({
        Accept: "application/json",
      })
      .expect(200);

    expect(response.body).toEqual({
      message: "Weekly xp leaderboard retrieved",
      data: [],
    });

    configSpy.mockRestore();
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
