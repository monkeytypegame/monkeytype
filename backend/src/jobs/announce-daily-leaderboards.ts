import { CronJob } from "cron";
import { getCurrentDayTimestamp } from "../utils/misc";
import { getCachedConfiguration } from "../init/configuration";
import { DailyLeaderboard } from "../utils/daily-leaderboards";
import { announceDailyLeaderboardTopResults } from "../tasks/george";

const CRON_SCHEDULE = "1 0 * * *"; // At 00:01.
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const leaderboardsToAnnounce = [
  {
    language: "english",
    mode: "time",
    mode2: "15",
  },
  {
    language: "english",
    mode: "time",
    mode2: "60",
  },
];

async function announceDailyLeaderboard(
  language: string,
  mode: string,
  mode2: string,
  dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"]
): Promise<void> {
  const yesterday = getCurrentDayTimestamp() - ONE_DAY_IN_MILLISECONDS;
  const dailyLeaderboard = new DailyLeaderboard(
    language,
    mode,
    mode2,
    yesterday
  );

  const topResults = await dailyLeaderboard.getResults(
    0,
    dailyLeaderboardsConfig.topResultsToAnnounce - 1,
    dailyLeaderboardsConfig
  );
  if (topResults.length === 0) {
    return;
  }

  const leaderboardId = `${mode} ${mode2} ${language}`;
  await announceDailyLeaderboardTopResults(
    leaderboardId,
    yesterday,
    topResults
  );
}

async function announceDailyLeaderboards(): Promise<void> {
  const { dailyLeaderboards, maintenance } = await getCachedConfiguration();
  if (!dailyLeaderboards.enabled || maintenance) {
    return;
  }

  await Promise.allSettled(
    leaderboardsToAnnounce.map(({ language, mode, mode2 }) => {
      return announceDailyLeaderboard(language, mode, mode2, dailyLeaderboards);
    })
  );
}

export default new CronJob(CRON_SCHEDULE, announceDailyLeaderboards);
