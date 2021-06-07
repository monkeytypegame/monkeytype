const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
class BotDAO {
  static async addCommand(command, arguments) {
    return await mongoDB()
      .collection("bot-commands")
      .insertOne({ command, arguments, executed: false, requestTimestamp: Date.now() });
  }
}

module.exports = BotDAO;