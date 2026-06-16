import { it, expect, describe } from "vitest";
import { LeaderboardEntrySchema } from "../src/leaderboards";

describe("leaderboards schemas", () => {
  describe("LeaderboardEntrySchema", () => {
    it.each([
      {
        description: "valid leaderboard entry",
        input: {
          wpm: 100,
          acc: 95,
          timestamp: 1234567890,
          raw: 105,
          uid: "user123",
          name: "Test User",
          rank: 1,
        },
      },
    ] as const)("$description", ({ input }) => {
      expect(LeaderboardEntrySchema).toValidate(input);
    });
  });
});
