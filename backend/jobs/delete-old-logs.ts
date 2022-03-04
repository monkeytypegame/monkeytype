import { CronJob } from "cron";
import db from "../init/db";
import Logger from "../utils/logger";

const CRON_SCHEDULE = "0 0 0 * * *";
const LOG_MAX_AGE_DAYS = 7;
const LOG_MAX_AGE_MILLISECONDS = LOG_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

async function deleteOldLogs(): Promise<void> {
  const data = await db
    .collection("logs")
    .deleteMany({ timestamp: { $lt: Date.now() - LOG_MAX_AGE_MILLISECONDS } });

  Logger.log(
    "system_logs_deleted",
    `${data.deletedCount} logs deleted older than ${LOG_MAX_AGE_DAYS} day(s)`,
    undefined
  );
}

export default new CronJob(CRON_SCHEDULE, deleteOldLogs);
