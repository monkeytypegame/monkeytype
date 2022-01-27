const { CronJob } = require("cron");
const { mongoDB } = require("../init/mongodb");
const BotDAO = require("../dao/bot");
const LeaderboardsDAO = require("../dao/leaderboards");

const CRON_SCHEDULE = "30 4/5 * * * *";
const RECENT_AGE = 1000 * 60 * 10;

async function updateLeaderboard(leaderboardTime) {
  const top10BeforeUpdate = await mongoDB()
    .collection(`leaderboards.english.time.${leaderboardTime}`)
    .find()
    .limit(10)
    .toArray();

  await LeaderboardsDAO.update("time", leaderboardTime, "english");

  const top10AfterUpdate = await mongoDB()
    .collection(`leaderboards.english.time.${leaderboardTime}`)
    .find()
    .limit(10)
    .toArray();

  const newRecordHolder = top10AfterUpdate.find((user, index) => {
    const userBefore = top10BeforeUpdate[index];
    const isRecentRecord = user.timestamp > Date.now() - RECENT_AGE;
    return userBefore.uid !== user.uid && isRecentRecord;
  });

  if (newRecordHolder) {
    const recordHolderId = newRecordHolder.discordId ?? newRecordHolder.name;
    BotDAO.announceLbUpdate(
      recordHolderId,
      newRecordHolder.rank,
      `time ${leaderboardTime} english`,
      newRecordHolder.wpm,
      newRecordHolder.raw,
      newRecordHolder.acc,
      newRecordHolder.consistency
    );
  }
}

async function updateLeaderboards() {
  await updateLeaderboard("15");
  await updateLeaderboard("60");
}

module.exports = new CronJob(CRON_SCHEDULE, updateLeaderboards);
