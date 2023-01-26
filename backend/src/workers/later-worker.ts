import _ from "lodash";
import IORedis from "ioredis";
import { Worker, Job } from "bullmq";
import Logger from "../utils/logger";
import { addToInboxBulk } from "../dal/user";
import GeorgeQueue from "../queues/george-queue";
import { buildMonkeyMail } from "../utils/monkey-mail";
import { DailyLeaderboard } from "../utils/daily-leaderboards";
import { getCachedConfiguration } from "../init/configuration";
import { getOrdinalNumberString, mapRange } from "../utils/misc";
import LaterQueue, { LaterTask } from "../queues/later-queue";

interface DailyLeaderboardMailContext {
  yesterdayTimestamp: number;
  modeRule: MonkeyTypes.ValidModeRule;
}

async function handleDailyLeaderboardResults(
  ctx: DailyLeaderboardMailContext
): Promise<void> {
  const { yesterdayTimestamp, modeRule } = ctx;
  const { language, mode, mode2 } = modeRule;
  const {
    dailyLeaderboards: dailyLeaderboardsConfig,
    users: { inbox: inboxConfig },
  } = await getCachedConfiguration(false);

  const dailyLeaderboard = new DailyLeaderboard(modeRule, yesterdayTimestamp);

  const allResults = await dailyLeaderboard.getResults(
    0,
    -1,
    dailyLeaderboardsConfig
  );

  if (allResults.length === 0) {
    return;
  }

  const { maxResults, xpRewardBrackets } = dailyLeaderboardsConfig;

  if (inboxConfig.enabled && xpRewardBrackets.length > 0) {
    const mailEntries: {
      uid: string;
      mail: MonkeyTypes.MonkeyMail[];
    }[] = [];

    allResults.forEach((entry) => {
      const rank = entry.rank ?? maxResults;
      const wpm = Math.round(entry.wpm);

      const placementString = getOrdinalNumberString(rank);

      const xpReward = _(xpRewardBrackets)
        .filter((bracket) => rank >= bracket.minRank && rank <= bracket.maxRank)
        .map((bracket) =>
          mapRange(
            rank,
            bracket.minRank,
            bracket.maxRank,
            bracket.maxReward,
            bracket.minReward
          )
        )
        .max();

      if (!xpReward) return;

      const rewardMail = buildMonkeyMail({
        subject: "Daily leaderboard placement",
        body: `Congratulations ${entry.name} on placing ${placementString} with ${wpm} wpm in the ${language} ${mode} ${mode2} daily leaderboard!`,
        rewards: [
          {
            type: "xp",
            item: Math.round(xpReward),
          },
        ],
      });

      mailEntries.push({
        uid: entry.uid,
        mail: [rewardMail],
      });
    });

    await addToInboxBulk(mailEntries, inboxConfig);
  }

  const topResults = allResults.slice(
    0,
    dailyLeaderboardsConfig.topResultsToAnnounce
  );

  const leaderboardId = `${mode} ${mode2} ${language}`;
  await GeorgeQueue.announceDailyLeaderboardTopResults(
    leaderboardId,
    yesterdayTimestamp,
    topResults
  );
}

async function jobHandler(job: Job): Promise<void> {
  const { taskName, ctx }: LaterTask = job.data;
  Logger.info(`Starting job: ${taskName}`);

  const start = performance.now();

  if (taskName === "daily-leaderboard-results") {
    await handleDailyLeaderboardResults(ctx);
  }

  const elapsed = performance.now() - start;

  Logger.success(`Job: ${taskName} - completed in ${elapsed}ms`);
}

export default (redisConnection?: IORedis.Redis): Worker =>
  new Worker(LaterQueue.queueName, jobHandler, {
    autorun: false,
    connection: redisConnection,
  });
