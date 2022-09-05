import { CronJob } from "cron";
import {
  getCurrentDayTimestamp,
  getOrdinalNumberString,
  mapRange,
} from "../utils/misc";
import { getCachedConfiguration } from "../init/configuration";
import { DailyLeaderboard } from "../utils/daily-leaderboards";
import { announceDailyLeaderboardTopResults } from "../tasks/george";
import { addToInboxBulk } from "../dal/user";
import { buildMonkeyMail } from "../utils/monkey-mail";

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
  dailyLeaderboardsConfig: MonkeyTypes.Configuration["dailyLeaderboards"],
  inboxConfig: MonkeyTypes.Configuration["users"]["inbox"]
): Promise<void> {
  const yesterday = getCurrentDayTimestamp() - ONE_DAY_IN_MILLISECONDS;
  const dailyLeaderboard = new DailyLeaderboard(
    language,
    mode,
    mode2,
    yesterday
  );

  const allResults = await dailyLeaderboard.getResults(
    0,
    -1,
    dailyLeaderboardsConfig
  );

  if (allResults.length === 0) {
    return;
  }

  if (inboxConfig.enabled) {
    const { maxXpReward, minXpReward, maxResults } = dailyLeaderboardsConfig;

    if (maxXpReward > 0) {
      const mailEntries = allResults.map((entry) => {
        const rank = entry.rank ?? maxResults;

        const placementString = getOrdinalNumberString(rank);
        const xpReward = Math.floor(
          mapRange(rank, 1, maxResults, maxXpReward, minXpReward)
        );

        const rewardMail = buildMonkeyMail({
          subject: "Daily leaderboard placement",
          body: `Congratulations ${entry.name} on placing ${placementString} in the ${language} ${mode} ${mode2} daily leaderboard!`,
          rewards: [
            {
              type: "xp",
              item: xpReward,
            },
          ],
        });

        return {
          uid: entry.uid,
          mail: [rewardMail],
        };
      });

      await addToInboxBulk(mailEntries, inboxConfig);
    }
  }

  const topResults = allResults.slice(
    0,
    dailyLeaderboardsConfig.topResultsToAnnounce
  );

  const leaderboardId = `${mode} ${mode2} ${language}`;
  await announceDailyLeaderboardTopResults(
    leaderboardId,
    yesterday,
    topResults
  );
}

async function announceDailyLeaderboards(): Promise<void> {
  const {
    dailyLeaderboards,
    users: { inbox },
    maintenance,
  } = await getCachedConfiguration();
  if (!dailyLeaderboards.enabled || maintenance) {
    return;
  }

  await Promise.allSettled(
    leaderboardsToAnnounce.map(({ language, mode, mode2 }) => {
      return announceDailyLeaderboard(
        language,
        mode,
        mode2,
        dailyLeaderboards,
        inbox
      );
    })
  );
}

export default new CronJob(CRON_SCHEDULE, announceDailyLeaderboards);
