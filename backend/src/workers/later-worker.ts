import IORedis from "ioredis";
import { Worker, Job, type ConnectionOptions } from "bullmq";
import Logger from "../utils/logger";
import { addToInboxBulk } from "../dal/user";
import GeorgeQueue from "../queues/george-queue";
import { buildMonkeyMail } from "../utils/monkey-mail";
import { DailyLeaderboard } from "../utils/daily-leaderboards";
import { getCachedConfiguration } from "../init/configuration";
import { formatSeconds, getOrdinalNumberString } from "../utils/misc";
import LaterQueue, {
  type LaterTask,
  type LaterTaskContexts,
  type LaterTaskType,
} from "../queues/later-queue";
import { recordTimeToCompleteJob } from "../utils/prometheus";
import { WeeklyXpLeaderboard } from "../services/weekly-xp-leaderboard";
import { MonkeyMail } from "@monkeytype/schemas/users";
import { isSafeNumber, mapRange } from "@monkeytype/util/numbers";
import { RewardBracket } from "@monkeytype/schemas/configuration";

async function handleDailyLeaderboardResults(
  ctx: LaterTaskContexts["daily-leaderboard-results"],
): Promise<void> {
  const { yesterdayTimestamp, modeRule } = ctx;
  const { language, mode, mode2 } = modeRule;
  const {
    dailyLeaderboards: dailyLeaderboardsConfig,
    users: { inbox: inboxConfig },
  } = await getCachedConfiguration(false);

  const { maxResults, xpRewardBrackets, topResultsToAnnounce } =
    dailyLeaderboardsConfig;

  const maxRankToGet = Math.max(
    topResultsToAnnounce,
    ...xpRewardBrackets.map((bracket) => bracket.maxRank),
  );

  const dailyLeaderboard = new DailyLeaderboard(modeRule, yesterdayTimestamp);

  const results = await dailyLeaderboard.getResults(
    0,
    maxRankToGet,
    dailyLeaderboardsConfig,
    false,
  );

  if (results === null || results.entries.length === 0) {
    return;
  }

  if (inboxConfig.enabled && xpRewardBrackets.length > 0) {
    const mailEntries: {
      uid: string;
      mail: MonkeyMail[];
    }[] = [];

    results.entries.forEach((entry) => {
      const rank = entry.rank ?? maxResults;
      const wpm = Math.round(entry.wpm);

      const placementString = getOrdinalNumberString(rank);

      const xpReward = calculateXpReward(xpRewardBrackets, rank);

      if (!isSafeNumber(xpReward)) return;

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

  const topResults = results.entries.slice(
    0,
    dailyLeaderboardsConfig.topResultsToAnnounce,
  );

  const leaderboardId = `${mode} ${mode2} ${language}`;
  await GeorgeQueue.announceDailyLeaderboardTopResults(
    leaderboardId,
    yesterdayTimestamp,
    topResults,
  );
}

async function handleWeeklyXpLeaderboardResults(
  ctx: LaterTaskContexts["weekly-xp-leaderboard-results"],
): Promise<void> {
  const {
    leaderboards: { weeklyXp: weeklyXpConfig },
    users: { inbox: inboxConfig },
  } = await getCachedConfiguration(false);

  const { enabled, xpRewardBrackets } = weeklyXpConfig;
  if (!enabled || xpRewardBrackets.length < 0) {
    return;
  }

  const { lastWeekTimestamp } = ctx;
  const weeklyXpLeaderboard = new WeeklyXpLeaderboard(lastWeekTimestamp);

  const maxRankToGet = Math.max(
    ...xpRewardBrackets.map((bracket) => bracket.maxRank),
  );

  const allResults = await weeklyXpLeaderboard.getResults(
    0,
    maxRankToGet,
    weeklyXpConfig,
    false,
  );

  if (allResults === null || allResults.entries.length === 0) {
    return;
  }

  const mailEntries: {
    uid: string;
    mail: MonkeyMail[];
  }[] = [];

  allResults?.entries.forEach((entry) => {
    // just in case, gonna ignore this error
    // oxlint-disable-next-line typescript/no-useless-default-assignment
    const { uid, name, rank = maxRankToGet, totalXp, timeTypedSeconds } = entry;

    const xp = Math.round(totalXp);
    const placementString = getOrdinalNumberString(rank);

    const xpReward = calculateXpReward(xpRewardBrackets, rank);

    if (!isSafeNumber(xpReward)) return;

    const rewardMail = buildMonkeyMail({
      subject: "Weekly XP Leaderboard placement",
      body: `Congratulations ${name} on placing ${placementString} with ${xp} xp! Last week, you typed for a total of ${formatSeconds(
        timeTypedSeconds,
      )}! Keep up the good work :)`,
      rewards: [
        {
          type: "xp",
          item: Math.round(xpReward),
        },
      ],
    });

    mailEntries.push({
      uid: uid,
      mail: [rewardMail],
    });
  });

  await addToInboxBulk(mailEntries, inboxConfig);
}

async function jobHandler(job: Job<LaterTask<LaterTaskType>>): Promise<void> {
  const { taskName, ctx } = job.data;

  Logger.info(`Starting job: ${taskName}`);

  const start = performance.now();

  if (taskName === "daily-leaderboard-results") {
    const taskCtx = ctx as LaterTaskContexts["daily-leaderboard-results"];
    await handleDailyLeaderboardResults(taskCtx);
  } else if (taskName === "weekly-xp-leaderboard-results") {
    const taskCtx = ctx as LaterTaskContexts["weekly-xp-leaderboard-results"];
    await handleWeeklyXpLeaderboardResults(taskCtx);
  }

  const elapsed = performance.now() - start;
  recordTimeToCompleteJob(LaterQueue.queueName, taskName, elapsed);
  Logger.success(`Job: ${taskName} - completed in ${elapsed}ms`);
}

function calculateXpReward(
  xpRewardBrackets: RewardBracket[],
  rank: number,
): number | undefined {
  const rewards = xpRewardBrackets
    .filter((bracket) => rank >= bracket.minRank && rank <= bracket.maxRank)
    .map((bracket) =>
      mapRange(
        rank,
        bracket.minRank,
        bracket.maxRank,
        bracket.maxReward,
        bracket.minReward,
      ),
    );
  return rewards.length ? Math.max(...rewards) : undefined;
}

export default (redisConnection?: IORedis.Redis): Worker => {
  const worker = new Worker(LaterQueue.queueName, jobHandler, {
    autorun: false,
    connection: redisConnection as ConnectionOptions,
  });
  worker.on("failed", (job, error) => {
    Logger.error(
      `Job: ${job.data.taskName} - failed with error "${error.message}"`,
    );
  });
  return worker;
};

export const __testing = {
  calculateXpReward,
};
