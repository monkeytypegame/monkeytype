import { it, expect, describe } from "vitest";
import { LeaderboardEntrySchema } from "../src/leaderboards";

const validLeaderboardEntry = {
  wpm: 100,
  acc: 95,
  timestamp: 1234567890,
  raw: 105,
  uid: "user123",
  name: "Test User",
  rank: 1,
};

describe("leaderboards schemas", () => {
  describe("LeaderboardEntrySchema", () => {
    it.each([
      {
        description: "valid leaderboard entry",
        input: validLeaderboardEntry,
      },
      {
        description: "invalid - negative wpm",
        input: { ...validLeaderboardEntry, wpm: -1 },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(LeaderboardEntrySchema).toReject(input, expectedError);
      } else {
        expect(LeaderboardEntrySchema).toValidate(input);
      }
    });
  });
});
