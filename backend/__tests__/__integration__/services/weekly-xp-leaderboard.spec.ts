import * as WeeklyXpLeaderboard from "../../../src/services/weekly-xp-leaderboard";
import { Configuration } from "@monkeytype/schemas/configuration";
import { ObjectId } from "mongodb";
import { RedisXpLeaderboardEntry } from "@monkeytype/schemas/leaderboards";
import { cleanupKeys, redisSetup } from "../redis";

const leaderboardsConfig: Configuration["leaderboards"]["weeklyXp"] = {
  enabled: true,
  expirationTimeInDays: 7,
  xpRewardBrackets: [],
};

describe("Weekly XP Leaderboards", () => {
  beforeAll(async () => {
    await redisSetup();
  });
  afterEach(async () => {
    await cleanupKeys(WeeklyXpLeaderboard.__testing.namespace);
  });

  describe("get", () => {
    it("should get if enabled", () => {
      expect(WeeklyXpLeaderboard.get(leaderboardsConfig)).toBeInstanceOf(
        WeeklyXpLeaderboard.WeeklyXpLeaderboard
      );
    });
    it("should return null if disabled", () => {
      expect(WeeklyXpLeaderboard.get({ enabled: false } as any)).toBeNull();
    });
  });

  describe("WeeklyXpLeaderboard class", () => {
    // oxlint-disable-next-line no-non-null-assertion
    const lb = WeeklyXpLeaderboard.get(leaderboardsConfig)!;

    describe("addResult", () => {
      it("adds results for user", async () => {
        //GIVEN
        const user1 = await givenResult(100, { timeTypedSeconds: 5 });
        await givenResult(50, { ...user1, timeTypedSeconds: 5 });
        const user2 = await givenResult(100, {
          isPremium: true,
          timeTypedSeconds: 7,
        });

        //WHEN
        const results = await lb.getResults(0, 10, leaderboardsConfig, true);

        //THEN
        expect(results).toEqual([
          {
            ...user1,
            rank: 1,
            timeTypedSeconds: 10,
            totalXp: 150,
            isPremium: false,
          },
          {
            ...user2,
            rank: 2,
            timeTypedSeconds: 7,
            totalXp: 100,
            isPremium: true,
          },
        ]);
      });
    });

    describe("getResults", () => {
      it("gets results", async () => {
        //GIVEN
        const user1 = await givenResult(150);
        const user2 = await givenResult(100);

        //WHEN
        const results = await lb.getResults(0, 10, leaderboardsConfig, true);

        //THEN
        expect(results).toEqual([
          { rank: 1, totalXp: 150, ...user1 },
          { rank: 2, totalXp: 100, ...user2 },
        ]);
      });

      it("gets results for page", async () => {
        //GIVEN
        const _user1 = await givenResult(100);
        const _user2 = await givenResult(75);
        const user3 = await givenResult(50);
        const user4 = await givenResult(25);

        //WHEN
        const results = await lb.getResults(1, 2, leaderboardsConfig, true);

        //THEN
        expect(results).toEqual([
          { rank: 3, totalXp: 50, ...user3 },
          { rank: 4, totalXp: 25, ...user4 },
        ]);
      });

      it("gets results without premium", async () => {
        //GIVEN
        const user1 = await givenResult(150, { isPremium: true });
        const user2 = await givenResult(100);

        //WHEN
        const results = await lb.getResults(0, 10, leaderboardsConfig, false);

        //THEN
        expect(results).toEqual([
          { rank: 1, totalXp: 150, ...user1, isPremium: undefined },
          { rank: 2, totalXp: 100, ...user2, isPremium: undefined },
        ]);
      });
    });

    describe("getRank", () => {
      it("gets rank", async () => {
        //GIVEN
        const user1 = await givenResult(100);
        const _user2 = await givenResult(150);

        //WHEN
        const rank = await lb.getRank(user1.uid, leaderboardsConfig);
        //THEN
        expect(rank).toEqual({ rank: 2, totalXp: 100, ...user1 });
      });
    });

    describe("getCount", () => {
      it("gets count", async () => {
        //GIVEN
        await givenResult(100);
        await givenResult(150);

        //WHEN
        const count = await lb.getCount();
        //THEN
        expect(count).toEqual(2);
      });
    });

    it("purgeUserFromDailyLeaderboards", async () => {
      //GIVEN
      const cheater = await givenResult(50);
      const validUser = await givenResult(1000);

      //WHEN
      await WeeklyXpLeaderboard.purgeUserFromXpLeaderboards(
        cheater.uid,
        leaderboardsConfig
      );
      //THEN
      expect(await lb.getRank(cheater.uid, leaderboardsConfig)).toBeNull();
      expect(await lb.getResults(0, 50, leaderboardsConfig, true)).toEqual([
        { rank: 1, totalXp: 1000, ...validUser },
      ]);
    });

    async function givenResult(
      xpGained: number,
      entry?: Partial<RedisXpLeaderboardEntry>
    ): Promise<RedisXpLeaderboardEntry> {
      const uid = new ObjectId().toHexString();
      const result: RedisXpLeaderboardEntry = {
        uid,
        name: `User ${uid}`,
        lastActivityTimestamp: Date.now(),
        timeTypedSeconds: 42,
        badgeId: 2,
        discordAvatar: `${uid}Avatar`,
        discordId: `${uid}DiscordId`,
        isPremium: false,
        ...entry,
      };

      await lb.addResult(leaderboardsConfig, { xpGained, entry: result });
      return result;
    }
  });
});
