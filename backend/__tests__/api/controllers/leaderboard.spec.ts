import _ from "lodash";
import { ObjectId } from "mongodb";
import request from "supertest";
import app from "../../../src/app";
import * as LeaderboardDal from "../../../src/dal/leaderboards";
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
