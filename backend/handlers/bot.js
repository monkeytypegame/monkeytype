
function updateDiscordRole(discordId, wpm) {
  newBotCommand = new BotCommand({
    command: "updateRole",
    arguments: [discordId, wpm],
    executed: false,
    requestTimestamp: Date.now(),
  });
  newBotCommand.save();
}

async function announceLbUpdate(discordId, pos, lb, wpm, raw, acc, con) {
  newBotCommand = new BotCommand({
    command: "sayLbUpdate",
    arguments: [discordId, pos, lb, wpm, raw, acc, con],
    executed: false,
    requestTimestamp: Date.now(),
  });
  newBotCommand.save();
}

async function announceDailyLbResult(lbdata) {
  newBotCommand = new BotCommand({
    command: "announceDailyLbResult",
    arguments: [lbdata],
    executed: false,
    requestTimestamp: Date.now(),
  });
  newBotCommand.save();
}

