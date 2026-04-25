import { UserProfile } from "@monkeytype/schemas/users";
import { describe, expect, it } from "vitest";

import { getAchievements } from "../../src/ts/utils/achievements";

function getProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name: "test-user",
    addedAt: 0,
    xp: 0,
    banned: false,
    lbOptOut: false,
    streak: 0,
    maxStreak: 0,
    details: {},
    allTimeLbs: {
      time: {},
    },
    typingStats: {
      startedTests: 0,
      completedTests: 0,
      timeTyping: 0,
    },
    personalBests: {
      time: {},
      words: {},
    },
    testActivity: {
      testsByDays: [],
      lastDay: 0,
    },
    ...overrides,
  };
}

describe("achievements.ts", () => {
  it("should mark achievements as unlocked when thresholds are met", () => {
    const achievements = getAchievements(
      getProfile({
        xp: 3000,
        maxStreak: 7,
        typingStats: {
          startedTests: 120,
          completedTests: 100,
          timeTyping: 10 * 60 * 60,
        },
        personalBests: {
          time: {
            "60": [
              {
                acc: 99,
                consistency: 80,
                difficulty: "normal",
                language: "english",
                raw: 110,
                timestamp: 1,
                wpm: 100,
              },
            ],
          },
          words: {},
        },
      }),
    );

    expect(achievements.every((it) => it.unlocked)).toBe(true);
  });

  it("should cap visible progress percentage while keeping raw progress labels", () => {
    const achievements = getAchievements(
      getProfile({
        typingStats: {
          startedTests: 10,
          completedTests: 250,
          timeTyping: 0,
        },
      }),
    );

    const committed = achievements.find((it) => it.id === "hundred_tests");

    expect(committed?.progressPercent).toBe(100);
    expect(committed?.progressLabel).toBe("250/100");
  });

  it("should derive wpm and level achievements from saved profile data", () => {
    const achievements = getAchievements(
      getProfile({
        xp: 2000,
        personalBests: {
          time: {},
          words: {
            "25": [
              {
                acc: 98,
                consistency: 75,
                difficulty: "normal",
                language: "english",
                raw: 130,
                timestamp: 1,
                wpm: 123,
              },
            ],
          },
        },
      }),
    );

    expect(achievements.find((it) => it.id === "hundred_wpm")?.unlocked).toBe(
      true,
    );
    expect(
      achievements.find((it) => it.id === "level_ten")?.progressLabel,
    ).toBe("Level 8/10");
  });
});
