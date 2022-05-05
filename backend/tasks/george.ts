import type IORedis from "ioredis";
import { Queue, QueueScheduler } from "bullmq";

const QUEUE_NAME = "george-tasks";

interface GeorgeTask {
  command: string;
  arguments: any[];
}

function buildGeorgeTask(command: string, taskArguments: any[]): GeorgeTask {
  return {
    command,
    arguments: taskArguments,
  };
}

let jobQueue: Queue;
let jobQueueScheduler: QueueScheduler;

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

  jobQueueScheduler = new QueueScheduler(QUEUE_NAME, {
    autorun: false,
    connection: redisConnection,
  });
  jobQueueScheduler.run();
}

async function addToQueue(command: string, task: GeorgeTask): Promise<void> {
  if (!jobQueue) {
    return;
  }

  await jobQueue.add(command, task);
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
  const command = "updateRole";
  const updateDiscordRoleTask = buildGeorgeTask(command, [discordId, wpm]);
  await addToQueue(command, updateDiscordRoleTask);
}

export async function linkDiscord(
  discordId: string,
  uid: string
): Promise<void> {
  const command = "linkDiscord";
  const linkDiscordTask = buildGeorgeTask(command, [discordId, uid]);
  await addToQueue(command, linkDiscordTask);
}

export async function unlinkDiscord(
  discordId: string,
  uid: string
): Promise<void> {
  const command = "unlinkDiscord";
  const unlinkDiscordTask = buildGeorgeTask(command, [discordId, uid]);
  await addToQueue(command, unlinkDiscordTask);
}

export async function awardChallenge(
  discordId: string,
  challengeName: string
): Promise<void> {
  const command = "awardChallenge";
  const awardChallengeTask = buildGeorgeTask(command, [
    discordId,
    challengeName,
  ]);
  await addToQueue(command, awardChallengeTask);
}

export async function announceLbUpdate(
  newRecords: any[],
  leaderboardId: string
): Promise<void> {
  const command = "announceLbUpdate";

  const leaderboardUpdateTasks = newRecords.map((record) => {
    const taskData = buildGeorgeTask(command, [
      record.discordId ?? record.name,
      record.rank,
      leaderboardId,
      record.wpm,
      record.raw,
      record.acc,
      record.consistency,
    ]);

    return {
      name: command,
      data: taskData,
    };
  });

  await addToQueueBulk(leaderboardUpdateTasks);
}
