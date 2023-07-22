import * as WeeklyXpLeaderboard from "../../src/services/weekly-xp-leaderboard";

const weeklyXpLeaderboardConfig = {
  enabled: true,
  expirationTimeInDays: 15,
  xpRewardBrackets: [],
};

describe("Weekly Xp Leaderboard", () => {
  it("should properly consider config", () => {
    const weeklyXpLeaderboard = WeeklyXpLeaderboard.get(
      weeklyXpLeaderboardConfig
    );
    expect(weeklyXpLeaderboard).toBeInstanceOf(
      WeeklyXpLeaderboard.WeeklyXpLeaderboard
    );

    weeklyXpLeaderboardConfig.enabled = false;

    const weeklyXpLeaderboardNull = WeeklyXpLeaderboard.get(
      weeklyXpLeaderboardConfig
    );
    expect(weeklyXpLeaderboardNull).toBeNull();
  });

  // TODO: Setup Redis mock and test the rest of this
});
