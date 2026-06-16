import { it, expect, describe } from "vitest";
import {
  LeaderboardEntrySchema,
  RedisDailyLeaderboardEntrySchema,
  RedisXpLeaderboardEntrySchema,
  RedisXpLeaderboardScoreSchema,
  XpLeaderboardEntrySchema,
} from "../src/leaderboards";

const validLeaderboardEntry = {
  wpm: 100,
  acc: 95,
  timestamp: 1234567890,
  raw: 105,
  consistency: 90,
  uid: "user123",
  name: "Test User",
  rank: 1,
};

const validRedisDailyLeaderboardEntry = {
  wpm: 100,
  acc: 95,
  timestamp: 1234567890,
  raw: 105,
  uid: "user123",
  name: "Test User",
};

const validRedisXpLeaderboardEntry = {
  uid: "user123",
  name: "Test User",
  lastActivityTimestamp: 1234567890,
  timeTypedSeconds: 3600,
};

const validRedisXpLeaderboardScore = 100;

const validXpLeaderboardEntry = {
  uid: "user123",
  name: "Test User",
  lastActivityTimestamp: 1234567890,
  timeTypedSeconds: 3600,
  totalXp: 1000,
  rank: 1,
};

describe("leaderboards schemas", () => {
  describe("LeaderboardEntrySchema", () => {
    it.each([
      { description: "valid leaderboard entry", input: validLeaderboardEntry },
      {
        description: "with optional fields",
        input: {
          ...validLeaderboardEntry,
          discordId: "discord123",
          badgeId: 1,
        },
      },
      {
        description: "invalid - negative wpm",
        input: { ...validLeaderboardEntry, wpm: -1 },
        expectedError: "Number must be greater than or equal to 0",
      },
      {
        description: "invalid - acc exceeds 100",
        input: { ...validLeaderboardEntry, acc: 101 },
        expectedError: "Number must be less than or equal to 100",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(LeaderboardEntrySchema).toReject(input, expectedError);
      } else {
        expect(LeaderboardEntrySchema).toValidate(input);
      }
    });
  });

  describe("RedisDailyLeaderboardEntrySchema", () => {
    it.each([
      {
        description: "valid redis daily leaderboard entry",
        input: validRedisDailyLeaderboardEntry,
      },
      {
        description: "invalid - missing uid",
        input: { ...validRedisDailyLeaderboardEntry, uid: undefined },
        expectedError: "Required",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(RedisDailyLeaderboardEntrySchema).toReject(input, expectedError);
      } else {
        expect(RedisDailyLeaderboardEntrySchema).toValidate(input);
      }
    });
  });

  describe("RedisXpLeaderboardEntrySchema", () => {
    it.each([
      {
        description: "valid redis xp leaderboard entry",
        input: validRedisXpLeaderboardEntry,
        expectedError: undefined,
      },
      {
        description: "with discordId and discordAvatar",
        input: {
          ...validRedisXpLeaderboardEntry,
          discordId: "discord123",
          discordAvatar: "avatar.png",
        },
        expectedError: undefined,
      },
      {
        description: "with null discordId (transformed to undefined)",
        input: {
          ...validRedisXpLeaderboardEntry,
          discordId: null as unknown as string | undefined,
        },
        expectedError: undefined,
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(RedisXpLeaderboardEntrySchema).toReject(input, expectedError);
      } else {
        expect(RedisXpLeaderboardEntrySchema).toValidate(input);
      }
    });
  });

  describe("RedisXpLeaderboardScoreSchema", () => {
    it.each([
      { description: "valid score", input: validRedisXpLeaderboardScore },
      {
        description: "invalid - negative score",
        input: -1,
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(RedisXpLeaderboardScoreSchema).toReject(input, expectedError);
      } else {
        expect(RedisXpLeaderboardScoreSchema).toValidate(input);
      }
    });
  });

  describe("XpLeaderboardEntrySchema", () => {
    it.each([
      {
        description: "valid xp leaderboard entry",
        input: validXpLeaderboardEntry,
      },
      {
        description: "invalid - negative totalXp",
        input: { ...validXpLeaderboardEntry, totalXp: -1 },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(XpLeaderboardEntrySchema).toReject(input, expectedError);
      } else {
        expect(XpLeaderboardEntrySchema).toValidate(input);
      }
    });
  });
});
