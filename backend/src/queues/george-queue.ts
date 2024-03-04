import { LbEntryWithRank } from "../utils/daily-leaderboards";
import { MonkeyQueue } from "./monkey-queue";

const QUEUE_NAME = "george-tasks";

type GeorgeTask = {
  name: string;
  args: unknown[];
};

function buildGeorgeTask(taskName: string, taskArgs: unknown[]): GeorgeTask {
  return {
    name: taskName,
    args: taskArgs,
  };
}

class GeorgeQueue extends MonkeyQueue<GeorgeTask> {
  async sendReleaseAnnouncement(releaseName: string): Promise<void> {
    const taskName = "sendReleaseAnnouncement";
    const sendReleaseAnnouncementTask = buildGeorgeTask(taskName, [
      releaseName,
    ]);
    await this.add(taskName, sendReleaseAnnouncementTask);
  }

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

  async userBanned(discordId: string, banned: boolean): Promise<void> {
    const taskName = "userBanned";
    const userBannedTask = buildGeorgeTask(taskName, [discordId, banned]);
    await this.add(taskName, userBannedTask);
  }

  async announceLeaderboardUpdate(
    newRecords: SharedTypes.LeaderboardEntry[],
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
    topResults: LbEntryWithRank[]
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
