import { UpdateResult } from "mongodb";
import db from "../init/db";
import _ from "lodash";

class ConfigDAO {
  static async saveConfig(uid, config): Promise<UpdateResult> {
    const configChanges = _.mapKeys(config, (value, key) => `config.${key}`);
    return await db
      .collection("configs")
      .updateOne({ uid }, { $set: configChanges }, { upsert: true });
  }

  static async getConfig(uid): Promise<object> {
    const config = await db.collection("configs").findOne({ uid });
    // if (!config) throw new MonkeyError(404, "Config not found");
    return config;
  }
}

export default ConfigDAO;
