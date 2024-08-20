import { CronJob } from "cron";
import GeorgeQueue from "../queues/george-queue";
import * as LeaderboardsDAL from "../dal/leaderboards";
import { getCachedConfiguration } from "../init/configuration";

const CRON_SCHEDULE = "30 14/15 * * * *";
const RECENT_AGE_MINUTES = 10;
const RECENT_AGE_MILLISECONDS = RECENT_AGE_MINUTES * 60 * 1000;

async function getTop10(
  leaderboardTime: string
): Promise<LeaderboardsDAL.DBLeaderboardEntry[]> {
  return (await LeaderboardsDAL.get(
    "time",
    leaderboardTime,
    "english",
    0,
    10
  )) as LeaderboardsDAL.DBLeaderboardEntry[]; //can do that because gettop10 will not be called during an update
}

async function updateLeaderboardAndNotifyChanges(
  leaderboardTime: string
): Promise<void> {
  const top10BeforeUpdate = await getTop10(leaderboardTime);

  const previousRecordsMap = Object.fromEntries(
    top10BeforeUpdate.map((record) => {
      return [record.uid, record];
    })
  );

  await LeaderboardsDAL.update("time", leaderboardTime, "english");

  const top10AfterUpdate = await getTop10(leaderboardTime);

  const newRecords = top10AfterUpdate.filter((record) => {
    const userId = record.uid;

    const previousMapUser = previousRecordsMap[userId];
    const userImprovedRank =
      previousMapUser && previousMapUser.rank > record.rank;

    const newUserInTop10 = !(userId in previousRecordsMap);

    const isRecentRecord =
      record.timestamp > Date.now() - RECENT_AGE_MILLISECONDS;

    return (userImprovedRank || newUserInTop10) && isRecentRecord;
  });

  if (newRecords.length > 0) {
    const leaderboardId = `time ${leaderboardTime} english`;

    await GeorgeQueue.announceLeaderboardUpdate(newRecords, leaderboardId);
  }
}

async function updateLeaderboards(): Promise<void> {
  const { maintenance } = await getCachedConfiguration();
  if (maintenance) {
    return;
  }

  await updateLeaderboardAndNotifyChanges("60");
  await updateLeaderboardAndNotifyChanges("15");
}

export default new CronJob(CRON_SCHEDULE, updateLeaderboards);
