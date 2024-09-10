import { CronJob } from "cron";

import { deleteAllApeKeys } from "../dal/ape-keys";
import * as BlocklistDal from "../dal/blocklist";
import { deleteConfig } from "../dal/config";
import { addImportantLog, deleteUserLogs } from "../dal/logs";
import { deleteAllPresets } from "../dal/preset";
import { deleteAll as deleteAllResults } from "../dal/result";
import * as UserDAL from "../dal/user";
import { getCachedConfiguration } from "../init/configuration";
import * as AuthUtil from "../utils/auth";
import { purgeUserFromDailyLeaderboards } from "../utils/daily-leaderboards";
import { mapLimit } from "../utils/misc";

const CRON_SCHEDULE = "*/10 * * * *"; // every 10 minutes
const DELETE_BATCH_SIZE = 50;
const CONCURRENT_DELETIONS = 5;

async function deleteUser(uid: string): Promise<void> {
  const config = await getCachedConfiguration();

  const userInfo = await UserDAL.getPartialUser(uid, "delete user", [
    "banned",
    "name",
    "email",
    "discordId",
  ]);

  if (userInfo.banned === true) {
    await BlocklistDal.add(userInfo);
  }

  // cleanup database
  await Promise.all([
    deleteUserLogs(uid),
    deleteAllApeKeys(uid),
    deleteAllPresets(uid),
    deleteConfig(uid),
    deleteAllResults(uid),
    purgeUserFromDailyLeaderboards(uid, config.dailyLeaderboards),
  ]);

  // delete user from auth
  await AuthUtil.deleteUser(uid);

  void addImportantLog(
    "user_deleted",
    `${userInfo.email} ${userInfo.name}`,
    uid
  );

  await UserDAL.deleteUser(uid);
}

async function deleteUsers(): Promise<void> {
  const softDeletedUsers = await UserDAL.getSoftDeletedUsers(DELETE_BATCH_SIZE);

  if (softDeletedUsers.length === 0) {
    return;
  }

  await mapLimit(softDeletedUsers, CONCURRENT_DELETIONS, async (user) => {
    await deleteUser(user.uid);
  });
}

export default new CronJob(CRON_SCHEDULE, deleteUsers);
