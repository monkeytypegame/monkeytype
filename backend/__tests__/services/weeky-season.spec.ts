import {
  getWeeklySeason,
  WeeklySeason,
} from "../../src/services/weekly-seasons";

const weeklySeasonConfig = {
  enabled: true,
  expirationTimeInDays: 15,
  xpRewardBrackets: [],
};

describe("Weekly seasons", () => {
  it("should properly consider config", () => {
    const weeklySeason = getWeeklySeason(weeklySeasonConfig);
    expect(weeklySeason).toBeInstanceOf(WeeklySeason);

    weeklySeasonConfig.enabled = false;

    const weeklySeasonNull = getWeeklySeason(weeklySeasonConfig);
    expect(weeklySeasonNull).toBeNull();
  });

  // TODO: Setup Redis mock and test the rest of this
});
