const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");

async function addCommand(command, arguments) {
  return await mongoDB().collection("bot-commands").insertOne({
    command,
    arguments,
    executed: false,
    requestTimestamp: Date.now(),
  });
}

async function addCommands(commands, arguments) {
  if (commands.length === 0 || commands.length !== arguments.length) {
    return [];
  }

  const normalizedCommands = commands.map((command, index) => {
    return {
      command,
      arguments: arguments[index],
      executed: false,
      requestTimestamp: Date.now(),
    };
  });

  return await mongoDB()
    .collection("bot-commands")
    .insertMany(normalizedCommands);
}

class BotDAO {
  static async updateDiscordRole(discordId, wpm) {
    return await addCommand("updateRole", [discordId, wpm]);
  }

  static async linkDiscord(uid, discordId) {
    return await addCommand("linkDiscord", [discordId, uid]);
  }

  static async unlinkDiscord(uid, discordId) {
    return await addCommand("unlinkDiscord", [discordId, uid]);
  }

  static async awardChallenge(discordId, challengeName) {
    return await addCommand("awardChallenge", [discordId, challengeName]);
  }

  static async announceLbUpdate(newRecords, leaderboardId) {
    if (newRecords.length === 0) {
      return [];
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

module.exports = BotDAO;
