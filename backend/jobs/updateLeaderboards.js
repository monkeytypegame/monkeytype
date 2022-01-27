const { CronJob } = require("cron");
const { mongoDB } = require("../init/mongodb");
const BotDAO = require("../dao/bot");
const LeaderboardsDAO = require("../dao/leaderboards");

const CRON_SCHEDULE = "30 4/5 * * * *";
const RECENT_AGE_MINUTES = 10;
const RECENT_AGE_MILLISECONDS = RECENT_AGE_MINUTES * 60 * 1000;

async function getTop10(leaderboardTime) {
  return await LeaderboardsDAO.get({
    language: "english",
    mode: "time",
    limit: 10,
    mode2: leaderboardTime,
  });
}

async function updateLeaderboardAndNotifyChanges(leaderboardTime) {
  const top10BeforeUpdate = await getTop10(leaderboardTime);

  await LeaderboardsDAO.update("time", leaderboardTime, "english");

  const top10AfterUpdate = await getTop10(leaderboardTime);

  const newRecord = top10AfterUpdate.find((record, index) => {
    const recordBefore = top10BeforeUpdate[index];
    const isRecentRecord =
      record.timestamp > Date.now() - RECENT_AGE_MILLISECONDS;
    return recordBefore.uid !== record.uid && isRecentRecord;
  });

  if (newRecord) {
    const recordHolderId = newRecord.discordId ?? newRecord.name;
    BotDAO.announceLbUpdate(
      recordHolderId,
      newRecord.rank,
      `time ${leaderboardTime} english`,
      newRecord.wpm,
      newRecord.raw,
      newRecord.acc,
      newRecord.consistency
    );
  }
}

async function updateLeaderboards() {
  await updateLeaderboardAndNotifyChanges("15");
  await updateLeaderboardAndNotifyChanges("60");
}

module.exports = new CronJob(CRON_SCHEDULE, updateLeaderboards);
