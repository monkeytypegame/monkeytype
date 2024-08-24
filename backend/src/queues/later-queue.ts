import LRUCache from "lru-cache";
import Logger from "../utils/logger";
import { MonkeyQueue } from "./monkey-queue";
import { getCurrentDayTimestamp, getCurrentWeekTimestamp } from "../utils/misc";
import { ValidModeRule } from "@monkeytype/contracts/schemas/configuration";

const QUEUE_NAME = "later";

export type LaterTaskType =
  | "daily-leaderboard-results"
  | "weekly-xp-leaderboard-results";

export type LaterTask<T extends LaterTaskType> = {
  taskName: LaterTaskType;
  ctx: LaterTaskContexts[T];
};

export type LaterTaskContexts = {
  "daily-leaderboard-results": {
    yesterdayTimestamp: number;
    modeRule: ValidModeRule;
  };
  "weekly-xp-leaderboard-results": {
    lastWeekTimestamp: number;
  };
};

const ONE_MINUTE_IN_MILLISECONDS = 1000 * 60;
const ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

class LaterQueue extends MonkeyQueue<LaterTask<LaterTaskType>> {
  private scheduledJobCache = new LRUCache<string, boolean>({
    max: 100,
  });

  private async scheduleTask(
    taskName: string,
    task: LaterTask<LaterTaskType>,
    jobId: string,
    delay: number
  ): Promise<void> {
    await this.add(taskName, task, {
      delay,
      jobId, // Prevent duplicate jobs
      backoff: 60 * ONE_MINUTE_IN_MILLISECONDS, // Try again every hour on failure
      attempts: 23,
    });

    this.scheduledJobCache.set(jobId, true);

    Logger.info(
      `Scheduled ${task.taskName} for ${new Date(Date.now() + delay)}`
    );
  }

  async scheduleForNextWeek(
    taskName: LaterTaskType,
    taskId: string
  ): Promise<void> {
    const currentWeekTimestamp = getCurrentWeekTimestamp();
    const jobId = `${taskName}:${currentWeekTimestamp}:${taskId}`;

    if (this.scheduledJobCache.has(jobId)) {
      return;
    }

    const task: LaterTask<LaterTaskType> = {
      taskName,
      ctx: {
        lastWeekTimestamp: currentWeekTimestamp,
      },
    };

    const delay =
      currentWeekTimestamp +
      7 * ONE_DAY_IN_MILLISECONDS -
      Date.now() +
      ONE_MINUTE_IN_MILLISECONDS;

    await this.scheduleTask("todo-next-week", task, jobId, delay);
  }

  async scheduleForTomorrow(
    taskName: LaterTaskType,
    taskId: string,
    modeRule: ValidModeRule
  ): Promise<void> {
    const currentDayTimestamp = getCurrentDayTimestamp();
    const jobId = `${taskName}:${currentDayTimestamp}:${taskId}`;

    if (this.scheduledJobCache.has(jobId)) {
      return;
    }

    const task: LaterTask<LaterTaskType> = {
      taskName,
      ctx: {
        modeRule,
        yesterdayTimestamp: currentDayTimestamp,
      },
    };

    const delay =
      currentDayTimestamp +
      ONE_DAY_IN_MILLISECONDS -
      Date.now() +
      ONE_MINUTE_IN_MILLISECONDS;

    await this.scheduleTask("todo-tomorrow", task, jobId, delay);
  }
}

export default new LaterQueue(QUEUE_NAME, {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});
