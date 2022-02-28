import { InsertManyResult, InsertOneResult } from "mongodb";
import db from "../init/db";

async function addCommand(
  command,
  commandArguments
): Promise<InsertOneResult<any>> {
  return await db.collection<any>("bot-commands").insertOne({
    command,
    arguments: commandArguments,
    executed: false,
    requestTimestamp: Date.now(),
  });
}

async function addCommands(
  commands,
  commandArguments
): Promise<void | InsertManyResult> {
  if (commands.length === 0 || commands.length !== commandArguments.length) {
    return;
  }

  const normalizedCommands = commands.map((command, index) => {
    return {
      command,
      arguments: commandArguments[index],
      executed: false,
      requestTimestamp: Date.now(),
    };
  });

  return await db.collection("bot-commands").insertMany(normalizedCommands);
}

class BotDAO {
  static async updateDiscordRole(discordId, wpm): Promise<InsertOneResult> {
    return await addCommand("updateRole", [discordId, wpm]);
  }

  static async linkDiscord(uid, discordId): Promise<InsertOneResult> {
    return await addCommand("linkDiscord", [discordId, uid]);
  }

  static async unlinkDiscord(uid, discordId): Promise<InsertOneResult> {
    return await addCommand("unlinkDiscord", [discordId, uid]);
  }

  static async awardChallenge(
    discordId,
    challengeName
  ): Promise<InsertOneResult> {
    return await addCommand("awardChallenge", [discordId, challengeName]);
  }

  static async announceLbUpdate(
    newRecords,
    leaderboardId
  ): Promise<InsertManyResult | void> {
    if (newRecords.length === 0) {
      return;
    }

    const leaderboardCommands = Array(newRecords.length).fill("sayLbUpdate");
    const leaderboardCommandsArguments = newRecords.map((newRecord) => {
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

    return await addCommands(leaderboardCommands, leaderboardCommandsArguments);
  }
}

export default BotDAO;
