const { CronJob } = require("cron");
const { mongoDB } = require("../init/mongodb");

const CRON_SCHEDULE = "0 0 0 * * *";
const LOG_MAX_AGE_DAYS = 7;

async function deleteOldLogs() {
  const maxAgeMilliseconds = LOG_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  const data = await mongoDB()
    .collection("logs")
    .deleteMany({ timestamp: { $lt: Date.now() - maxAgeMilliseconds } });

  Logger.log(
    "system_logs_deleted",
    `${data.deletedCount} logs deleted older than ${LOG_MAX_AGE_DAYS} day(s)`,
    undefined
  );
}

module.exports = new CronJob(CRON_SCHEDULE, deleteOldLogs);
