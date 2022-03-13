import { UpdateResult } from "mongodb";
import db from "../init/db";
import _ from "lodash";

class ConfigDAO {
  static async saveConfig(uid: string, config: object): Promise<UpdateResult> {
    const configChanges = _.mapKeys(config, (_value, key) => `config.${key}`);
    return await db
      .collection<any>("configs")
      .updateOne({ uid }, { $set: configChanges }, { upsert: true });
  }

  static async getConfig(uid: string): Promise<any> {
    const config = await db.collection<any>("configs").findOne({ uid });
    // if (!config) throw new MonkeyError(404, "Config not found");
    return config;
  }
}

export default ConfigDAO;
