import type IORedis from "ioredis";
import { Queue, QueueScheduler } from "bullmq";

const QUEUE_NAME = "george-tasks";

interface GeorgeTask {
  name: string;
  args: any[];
}

function buildGeorgeTask(taskName: string, taskArgs: any[]): GeorgeTask {
  return {
    name: taskName,
    args: taskArgs,
  };
}

let jobQueue: Queue;
let _queueScheduler: QueueScheduler;

export function initJobQueue(redisConnection: IORedis.Redis | undefined): void {
  if (jobQueue || !redisConnection) {
    return;
  }

  jobQueue = new Queue(QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  });

  _queueScheduler = new QueueScheduler(QUEUE_NAME, {
    connection: redisConnection,
  });
}

async function addToQueue(taskName: string, task: GeorgeTask): Promise<void> {
  if (!jobQueue) {
    return;
  }

  await jobQueue.add(taskName, task);
}

async function addToQueueBulk(
  tasks: { name: string; data: GeorgeTask }[]
): Promise<void> {
  if (!jobQueue) {
    return;
  }

  await jobQueue.addBulk(tasks);
}

export async function updateDiscordRole(
  discordId: string,
  wpm: number
): Promise<void> {
  const taskName = "updateRole";
  const updateDiscordRoleTask = buildGeorgeTask(taskName, [discordId, wpm]);
  await addToQueue(taskName, updateDiscordRoleTask);
}

export async function linkDiscord(
  discordId: string,
  uid: string
): Promise<void> {
  const taskName = "linkDiscord";
  const linkDiscordTask = buildGeorgeTask(taskName, [discordId, uid]);
  await addToQueue(taskName, linkDiscordTask);
}

export async function unlinkDiscord(
  discordId: string,
  uid: string
): Promise<void> {
  const taskName = "unlinkDiscord";
  const unlinkDiscordTask = buildGeorgeTask(taskName, [discordId, uid]);
  await addToQueue(taskName, unlinkDiscordTask);
}

export async function awardChallenge(
  discordId: string,
  challengeName: string
): Promise<void> {
  const taskName = "awardChallenge";
  const awardChallengeTask = buildGeorgeTask(taskName, [
    discordId,
    challengeName,
  ]);
  await addToQueue(taskName, awardChallengeTask);
}

export async function announceLeaderboardUpdate(
  newRecords: any[],
  leaderboardId: string
): Promise<void> {
  const taskName = "announceLeaderboardUpdate";

  const leaderboardUpdateTasks = newRecords.map((record) => {
    const taskData = buildGeorgeTask(taskName, [
      record.discordId ?? record.name,
      record.rank,
      leaderboardId,
      record.wpm,
      record.raw,
      record.acc,
      record.consistency,
    ]);

    return {
      name: taskName,
      data: taskData,
    };
  });

  await addToQueueBulk(leaderboardUpdateTasks);
}

export async function announceDailyLeaderboardTopResults(
  leaderboardId: string,
  leaderboardTimestamp: number,
  topResults: any[]
): Promise<void> {
  const taskName = "announceDailyLeaderboardTopResults";

  const dailyLeaderboardTopResultsTask = buildGeorgeTask(taskName, [
    taskName,
    [leaderboardId, leaderboardTimestamp, topResults],
  ]);

  await addToQueue(taskName, dailyLeaderboardTopResultsTask);
}
