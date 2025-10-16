import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { Mode, Mode2 } from "@monkeytype/schemas/shared";
import * as DailyLeaderboards from "../../../src/utils/daily-leaderboards";
import { cleanupKeys, redisSetup } from "../redis";
import { Language } from "@monkeytype/schemas/languages";

import { RedisDailyLeaderboardEntry } from "@monkeytype/schemas/leaderboards";
import { ObjectId } from "mongodb";
import { Configuration } from "@monkeytype/schemas/configuration";

const dailyLeaderboardsConfig: Configuration["dailyLeaderboards"] = {
  enabled: true,
  maxResults: 10,
  leaderboardExpirationTimeInDays: 1,
  validModeRules: [
    {
      language: "(english|spanish)",
      mode: "time",
      mode2: "(15|60)",
    },
    {
      language: "french",
      mode: "words",
      mode2: "\\d+",
    },
  ],
  topResultsToAnnounce: 3,
  xpRewardBrackets: [],
  scheduleRewardsModeRules: [],
};

describe("Daily Leaderboards", () => {
  beforeAll(async () => {
    await redisSetup();
  });
  afterEach(async () => {
    await cleanupKeys(DailyLeaderboards.__testing.namespace);
  });
  describe("should properly handle valid and invalid modes", () => {
    const testCases: {
      language: Language;
      mode: Mode;
      mode2: Mode2<any>;
      expected: boolean;
    }[] = [
      {
        language: "english",
        mode: "time",
        mode2: "60",
        expected: true,
      },
      {
        language: "spanish",
        mode: "time",
        mode2: "15",
        expected: true,
      },
      {
        language: "english",
        mode: "time",
        mode2: "600",
        expected: false,
      },
      {
        language: "spanish",
        mode: "words",
        mode2: "150",
        expected: false,
      },
      {
        language: "french",
        mode: "time",
        mode2: "600",
        expected: false,
      },
      {
        language: "french",
        mode: "words",
        mode2: "100",
        expected: true,
      },
    ];

    it.for(testCases)(
      `language=$language, mode=$mode mode2=$mode2 expect $expected`,
      ({ language, mode, mode2, expected }) => {
        const result = DailyLeaderboards.getDailyLeaderboard(
          language,
          mode,
          mode2 as any,
          dailyLeaderboardsConfig
        );
        expect(!!result).toBe(expected);
      }
    );
  });
  describe("DailyLeaderboard class", () => {
    // oxlint-disable-next-line no-non-null-assertion
    const lb = DailyLeaderboards.getDailyLeaderboard(
      "english",
      "time",
      "60",
      dailyLeaderboardsConfig
    )!;
    describe("addResult", () => {
      it("adds best result for user", async () => {
        //GIVEN
        const uid = new ObjectId().toHexString();
        await givenResult({ uid, wpm: 50 });
        const bestResult = await givenResult({ uid, wpm: 55 });
        await givenResult({ uid, wpm: 53 });

        const user2 = await givenResult({ wpm: 20 });

        //WHEN
        const results = await lb.getResults(
          0,
          5,
          dailyLeaderboardsConfig,
          true
        );
        //THEN
        expect(results).toEqual([
          { rank: 1, ...bestResult },
          { rank: 2, ...user2 },
        ]);
      });

      it("limits max amount of results", async () => {
        //GIVEN
        const maxResults = dailyLeaderboardsConfig.maxResults;

        const bob = await givenResult({ wpm: 10 });
        await Promise.all(
          new Array(maxResults - 1)
            .fill(0)
            .map(() => givenResult({ wpm: 20 + Math.random() * 100 }))
        );
        expect(await lb.getCount()).toEqual(maxResults);
        expect(await lb.getRank(bob.uid, dailyLeaderboardsConfig)).toEqual({
          rank: maxResults,
          ...bob,
        });

        //WHEN
        await givenResult({ wpm: 11 });

        //THEN
        //max count is still the same, but bob is no longer on the leaderboard
        expect(await lb.getCount()).toEqual(maxResults);
        expect(await lb.getRank(bob.uid, dailyLeaderboardsConfig)).toBeNull();
      });
    });
    describe("getResults", () => {
      it("gets result", async () => {
        //GIVEN
        const user1 = await givenResult({ wpm: 50, isPremium: true });
        const user2 = await givenResult({ wpm: 60 });
        const user3 = await givenResult({ wpm: 40 });

        //WHEN
        const results = await lb.getResults(
          0,
          5,
          dailyLeaderboardsConfig,
          true
        );
        //THEN
        expect(results).toEqual([
          { rank: 1, ...user2 },
          { rank: 2, ...user1 },
          { rank: 3, ...user3 },
        ]);
      });
      it("gets result for page", async () => {
        //GIVEN
        const user4 = await givenResult({ wpm: 45 });
        const _user5 = await givenResult({ wpm: 20 });
        const _user1 = await givenResult({ wpm: 50 });
        const _user2 = await givenResult({ wpm: 60 });
        const user3 = await givenResult({ wpm: 40 });

        //WHEN
        const results = await lb.getResults(
          1,
          2,
          dailyLeaderboardsConfig,
          true
        );
        //THEN
        expect(results).toEqual([
          { rank: 3, ...user4 },
          { rank: 4, ...user3 },
        ]);
      });

      it("gets result without premium", async () => {
        //GIVEN
        const user1 = await givenResult({ wpm: 50, isPremium: true });
        const user2 = await givenResult({ wpm: 60 });
        const user3 = await givenResult({ wpm: 40, isPremium: true });

        //WHEN
        const results = await lb.getResults(
          0,
          5,
          dailyLeaderboardsConfig,
          false
        );
        //THEN
        expect(results).toEqual([
          { rank: 1, ...user2, isPremium: undefined },
          { rank: 2, ...user1, isPremium: undefined },
          { rank: 3, ...user3, isPremium: undefined },
        ]);
      });
    });

    describe("minWPm", () => {
      it("gets min wpm", async () => {
        //GIVEN
        await givenResult({ wpm: 50 });
        await givenResult({ wpm: 60 });

        //WHEN
        const minWpm = await lb.getMinWpm(dailyLeaderboardsConfig);
        //THEN
        expect(minWpm).toEqual(50);
      });
    });

    describe("getRank", () => {
      it("gets rank", async () => {
        //GIVEN
        const user1 = await givenResult({ wpm: 50 });
        const _user2 = await givenResult({ wpm: 60 });

        //WHEN
        const rank = await lb.getRank(user1.uid, dailyLeaderboardsConfig);
        //THEN
        expect(rank).toEqual({ rank: 2, ...user1 });
      });
    });

    describe("getCount", () => {
      it("gets count", async () => {
        //GIVEN
        await givenResult({ wpm: 50 });
        await givenResult({ wpm: 60 });

        //WHEN
        const count = await lb.getCount();
        //THEN
        expect(count).toEqual(2);
      });
    });

    it("purgeUserFromDailyLeaderboards", async () => {
      //GIVEN
      const cheater = await givenResult({ wpm: 50 });
      const validUser = await givenResult();

      //WHEN
      await DailyLeaderboards.purgeUserFromDailyLeaderboards(
        cheater.uid,
        dailyLeaderboardsConfig
      );
      //THEN
      expect(await lb.getRank(cheater.uid, dailyLeaderboardsConfig)).toBeNull();
      expect(await lb.getResults(0, 50, dailyLeaderboardsConfig, true)).toEqual(
        [{ rank: 1, ...validUser }]
      );
    });

    async function givenResult(
      entry?: Partial<RedisDailyLeaderboardEntry>
    ): Promise<RedisDailyLeaderboardEntry> {
      const uid = new ObjectId().toHexString();
      const result = {
        acc: 85,
        name: `User ${uid}`,
        raw: 100,
        wpm: 95,
        timestamp: Date.now(),
        uid: uid,
        badgeId: 2,
        consistency: 90,
        discordAvatar: `${uid}Avatar`,
        discordId: `${uid}DiscordId`,
        isPremium: false,
        ...entry,
      };
      await lb.addResult(result, dailyLeaderboardsConfig);
      return result;
    }
  });
});
