import { Configuration } from "@monkeytype/schemas/configuration";
import { tryCatch } from "@monkeytype/util/trycatch";
import { deleteAllApeKeys } from "../dal/ape-keys";
import * as BlocklistDal from "../dal/blocklist";
import { deleteConfig } from "../dal/config";
import * as ConnectionsDal from "../dal/connections";
import { deleteUserLogs } from "../dal/logs";
import { deleteAllPresets } from "../dal/preset";
import { deleteAll as deleteAllResults } from "../dal/result";
import * as UserDAL from "../dal/user";
import GeorgeQueue from "../queues/george-queue";
import * as AuthUtil from "../utils/auth";
import { purgeUserFromDailyLeaderboards } from "../utils/daily-leaderboards";
import MonkeyError, { isFirebaseError } from "../utils/error";
import { purgeUserFromXpLeaderboards } from "./weekly-xp-leaderboard";

type DeletedUserInfo = Pick<
  UserDAL.DBUser,
  "banned" | "name" | "email" | "discordId"
>;

/**
 * Delete all data of the given user, including their authentication.
 * Missing user data is ignored so partially deleted users can be cleaned up.
 * @returns the user info of the deleted user, if it still existed.
 */
export async function deleteUserAccount(
  uid: string,
  configuration: Configuration,
): Promise<DeletedUserInfo | undefined> {
  const { data: userInfo, error } = await tryCatch(
    UserDAL.getPartialUser(uid, "delete user", [
      "banned",
      "name",
      "email",
      "discordId",
    ]),
  );

  if (error) {
    if (error instanceof MonkeyError && error.status === 404) {
      //userinfo was already deleted. We ignore this and still try to remove the  other data
    } else {
      throw error;
    }
  }

  if (userInfo?.banned === true) {
    await BlocklistDal.add(userInfo);
  }

  //cleanup database
  const tasks = [
    UserDAL.deleteUser(uid),
    deleteUserLogs(uid),
    deleteAllApeKeys(uid),
    deleteAllPresets(uid),
    deleteConfig(uid),
    deleteAllResults(uid),
    purgeUserFromDailyLeaderboards(uid, configuration.dailyLeaderboards),
    purgeUserFromXpLeaderboards(uid, configuration.leaderboards.weeklyXp),
    ConnectionsDal.deleteByUid(uid),
  ];

  if (userInfo?.discordId !== undefined) {
    tasks.push(GeorgeQueue.unlinkDiscord(userInfo.discordId, uid));
  }

  await Promise.all(tasks);

  try {
    //delete user from firebase
    await AuthUtil.deleteUser(uid);
  } catch (e) {
    if (isFirebaseError(e) && e.errorInfo.code === "auth/user-not-found") {
      //user was already deleted, ok to ignore
    } else {
      throw e;
    }
  }

  return userInfo ?? undefined;
}
