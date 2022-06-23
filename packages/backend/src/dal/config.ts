import { UpdateResult } from "mongodb";
import * as db from "../init/db";
import _ from "lodash";

export async function saveConfig(
  uid: string,
  config: object
): Promise<UpdateResult> {
  const configChanges = _.mapKeys(config, (_value, key) => `config.${key}`);
  return await db
    .collection<any>("configs")
    .updateOne({ uid }, { $set: configChanges }, { upsert: true });
}

export async function getConfig(uid: string): Promise<any> {
  const config = await db.collection<any>("configs").findOne({ uid });
  return config;
}
