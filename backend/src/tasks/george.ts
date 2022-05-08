import type IORedis from "ioredis";
import { Queue, QueueScheduler } from "bullmq";

const QUEUE_NAME = "george-tasks";

type GeorgeTaskArgument = string | number;

interface GeorgeTask {
  name: string;
  args: GeorgeTaskArgument[];
}

function buildGeorgeTask(task: string, taskArgs: GeorgeTaskArgument[]): GeorgeTask {
  return {
    name: task,
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
  const task = "updateRole";
  const updateDiscordRoleTask = buildGeorgeTask(task, [discordId, wpm]);
  await addToQueue(task, updateDiscordRoleTask);
}

export async function linkDiscord(
  discordId: string,
  uid: string
): Promise<void> {
  const task = "linkDiscord";
  const linkDiscordTask = buildGeorgeTask(task, [discordId, uid]);
  await addToQueue(task, linkDiscordTask);
}

export async function unlinkDiscord(
  discordId: string,
  uid: string
): Promise<void> {
  const task = "unlinkDiscord";
  const unlinkDiscordTask = buildGeorgeTask(task, [discordId, uid]);
  await addToQueue(task, unlinkDiscordTask);
}

export async function awardChallenge(
  discordId: string,
  challengeName: string
): Promise<void> {
  const task = "awardChallenge";
  const awardChallengeTask = buildGeorgeTask(task, [
    discordId,
    challengeName,
  ]);
  await addToQueue(task, awardChallengeTask);
}

export async function announceLeaderboardUpdate(
  newRecords: any[],
  leaderboardId: string
): Promise<void> {
  const task = "announceLeaderboardUpdate";

  const leaderboardUpdateTasks = newRecords.map((record) => {
    const taskData = buildGeorgeTask(task, [
      record.discordId ?? record.name,
      record.rank,
      leaderboardId,
      record.wpm,
      record.raw,
      record.acc,
      record.consistency,
    ]);

    return {
      name: task,
      data: taskData,
    };
  });

  await addToQueueBulk(leaderboardUpdateTasks);
}
