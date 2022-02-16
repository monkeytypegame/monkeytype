import db from "../init/db";

class ConfigDAO {
  static async saveConfig(uid, config) {
    return await db
      .collection("configs")
      .updateOne({ uid }, { $set: { config } }, { upsert: true });
  }

  static async getConfig(uid) {
    let config = await db.collection("configs").findOne({ uid });
    // if (!config) throw new MonkeyError(404, "Config not found");
    return config;
  }
}

export default ConfigDAO;
