const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");

class ConfigDAO {

  static async saveConfig(uid, config) {
    return await mongoDB()
      .collection("configs")
      .updateOne({ uid }, { $set: { config } }, { upsert: true });
  }

}

module.exports = ConfigDAO;
