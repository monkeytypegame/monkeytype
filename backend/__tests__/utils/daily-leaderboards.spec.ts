import { getDailyLeaderboard } from "../../src/utils/daily-leaderboards";

const dailyLeaderboardsConfig = {
  enabled: true,
  maxResults: 3,
  leaderboardExpirationTimeInDays: 1,
  validModeRules: [
    {
      language: "english",
      mode: "time",
      mode2: "15|60",
    },
  ],
};

describe("Daily Leaderboards", () => {
  it("should properly handle valid and invalid modes", () => {
    const validLeaderboard = getDailyLeaderboard(
      "english",
      "time",
      "60",
      dailyLeaderboardsConfig
    );
    const invalidLeaderboard = getDailyLeaderboard(
      "spanish",
      "quotes",
      "61",
      dailyLeaderboardsConfig
    );

    expect(validLeaderboard).toBeTruthy();
    expect(invalidLeaderboard).toBe(null);
  });

  // TODO: Setup Redis mock and test the rest of this
});
