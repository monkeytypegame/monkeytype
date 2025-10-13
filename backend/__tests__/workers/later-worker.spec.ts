import { describe, it, expect } from "vitest";
import * as LaterWorker from "../../src/workers/later-worker";
const calculateXpReward = LaterWorker.__testing.calculateXpReward;

describe("later-worker", () => {
  describe("calculateXpReward", () => {
    it("should return the correct XP reward for a given rank", () => {
      //GIVEN
      const xpRewardBrackets = [
        { minRank: 1, maxRank: 1, minReward: 100, maxReward: 100 },
        { minRank: 2, maxRank: 10, minReward: 50, maxReward: 90 },
      ];

      //WHEN / THEN
      expect(calculateXpReward(xpRewardBrackets, 5)).toBe(75);
      expect(calculateXpReward(xpRewardBrackets, 11)).toBeUndefined();
    });

    it("should return the highest XP reward if brackets overlap", () => {
      //GIVEN
      const xpRewardBrackets = [
        { minRank: 1, maxRank: 5, minReward: 900, maxReward: 1000 },
        { minRank: 2, maxRank: 20, minReward: 50, maxReward: 90 },
      ];

      //WHEN
      const reward = calculateXpReward(xpRewardBrackets, 5);

      //THEN
      expect(reward).toBe(900);
    });
  });
});
