import { MonkeyQueue } from "./monkey-queue";

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

class GeorgeQueue extends MonkeyQueue<GeorgeTask> {
  async updateDiscordRole(discordId: string, wpm: number): Promise<void> {
    const taskName = "updateRole";
    const updateDiscordRoleTask = buildGeorgeTask(taskName, [discordId, wpm]);
    await this.add(taskName, updateDiscordRoleTask);
  }

  async linkDiscord(discordId: string, uid: string): Promise<void> {
    const taskName = "linkDiscord";
    const linkDiscordTask = buildGeorgeTask(taskName, [discordId, uid]);
    await this.add(taskName, linkDiscordTask);
  }

  async unlinkDiscord(discordId: string, uid: string): Promise<void> {
    const taskName = "unlinkDiscord";
    const unlinkDiscordTask = buildGeorgeTask(taskName, [discordId, uid]);
    await this.add(taskName, unlinkDiscordTask);
  }

  async awardChallenge(
    discordId: string,
    challengeName: string
  ): Promise<void> {
    const taskName = "awardChallenge";
    const awardChallengeTask = buildGeorgeTask(taskName, [
      discordId,
      challengeName,
    ]);
    await this.add(taskName, awardChallengeTask);
  }

  async announceLeaderboardUpdate(
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

    await this.addBulk(leaderboardUpdateTasks);
  }

  async announceDailyLeaderboardTopResults(
    leaderboardId: string,
    leaderboardTimestamp: number,
    topResults: any[]
  ): Promise<void> {
    const taskName = "announceDailyLeaderboardTopResults";

    const dailyLeaderboardTopResultsTask = buildGeorgeTask(taskName, [
      leaderboardId,
      leaderboardTimestamp,
      topResults,
    ]);

    await this.add(taskName, dailyLeaderboardTopResultsTask);
  }
}

export default new GeorgeQueue(QUEUE_NAME, {
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
