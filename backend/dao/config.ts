import { UpdateResult } from "mongodb";
import db from "../init/db";

class ConfigDAO {
  static async saveConfig(uid, config): Promise<UpdateResult> {
    //https://stackoverflow.com/questions/10290621/how-do-i-partially-update-an-object-in-mongodb-so-the-new-object-will-overlay
    const temp = {};
    for (const key in config) {
      const value = config[key];
      temp["config." + key] = value;
    }

    return await db
      .collection("configs")
      .updateOne({ uid }, { $set: temp }, { upsert: true });
  }

  static async getConfig(uid): Promise<object> {
    const config = await db.collection("configs").findOne({ uid });
    // if (!config) throw new MonkeyError(404, "Config not found");
    return config;
  }
}

export default ConfigDAO;
