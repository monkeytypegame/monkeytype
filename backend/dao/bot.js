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

class BotDAO {
  static async updateDiscordRole(discordId, wpm) {
    return await addCommand("updateRole", [discordId, wpm]);
  }

  static async linkDiscord(uid, discordId) {
    return await addCommand("linkDiscord", [discordId, uid]);
  }

  static async awardChallenge(discordId, challengeName) {
    return await addCommand("awardChallenge", [discordId, challengeName]);
  }

  static async announceLbUpdate(discordId, pos, lb, wpm, raw, acc, con) {
    return await addCommand("sayLbUpdate", [
      discordId,
      pos,
      lb,
      wpm,
      raw,
      acc,
      con,
    ]);
  }

  // this probably will be rewritten but keeping the old code just in case
  // static async announceDailyLbResult(lbdata) {
  //   return await addCommand("announceDailyLbResult", [lbdata]);
  // }
}

module.exports = BotDAO;
