import { UpdateResult } from "mongodb";
import db from "../init/db";

class ConfigDAO {
  static async saveConfig(uid, config): Promise<UpdateResult> {
    return await db
      .collection("configs")
      .updateOne({ uid }, { $set: { config } }, { upsert: true });
  }

  static async getConfig(uid): Promise<object> {
    const config = await db.collection("configs").findOne({ uid });
    // if (!config) throw new MonkeyError(404, "Config not found");
    return config;
  }
}

export default ConfigDAO;
