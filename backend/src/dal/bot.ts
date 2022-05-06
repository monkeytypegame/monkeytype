import { InsertManyResult, InsertOneResult } from "mongodb";
import * as db from "../init/db";

async function addTask(
  task,
  taskArgs
): Promise<InsertOneResult<any>> {
  return await db.collection<any>("bot-tasks").insertOne({
    name: task,
    args: taskArgs,
    requestTimestamp: Date.now(),
  });
}

async function addTasks(
  tasks,
  taskArgs
): Promise<void | InsertManyResult> {
  if (tasks.length === 0 || tasks.length !== taskArgs.length) {
    return;
  }

  const normalizedTasks = tasks.map((task, index) => {
    return {
      name: task,
      args: taskArgs[index],
      requestTimestamp: Date.now(),
    };
  });

  return await db.collection("bot-tasks").insertMany(normalizedTasks);
}

export async function updateDiscordRole(
  discordId,
  wpm
): Promise<InsertOneResult> {
  return await addTask("updateRole", [discordId, wpm]);
}

export async function linkDiscord(uid, discordId): Promise<InsertOneResult> {
  return await addTask("linkDiscord", [discordId, uid]);
}

export async function unlinkDiscord(uid, discordId): Promise<InsertOneResult> {
  return await addTask("unlinkDiscord", [discordId, uid]);
}

export async function awardChallenge(
  discordId,
  challengeName
): Promise<InsertOneResult> {
  return await addTask("awardChallenge", [discordId, challengeName]);
}

export async function announceLeaderboardUpdate(
  newRecords,
  leaderboardId
): Promise<InsertManyResult | void> {
  if (newRecords.length === 0) {
    return;
  }

  const leaderboardTasks = Array(newRecords.length).fill("sayLbUpdate");
  const leaderboardTaskArgs = newRecords.map((newRecord) => {
    return [
      newRecord.discordId ?? newRecord.name,
      newRecord.rank,
      leaderboardId,
      newRecord.wpm,
      newRecord.raw,
      newRecord.acc,
      newRecord.consistency,
    ];
  });

  return await addTasks(leaderboardTasks, leaderboardTaskArgs);
}
