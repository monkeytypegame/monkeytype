import { type UpdateResult } from "mongodb";
import * as db from "../init/db";
import _ from "lodash";
import { Config } from "@monkeytype/shared-types/config";

const configLegacyProperties = [
  "swapEscAndTab",
  "quickTab",
  "chartStyle",
  "chartAverage10",
  "chartAverage100",
  "alwaysShowCPM",
  "resultFilters",
  "chartAccuracy",
  "liveSpeed",
  "extraTestColor",
  "savedLayout",
  "showTimerBar",
  "showDiscordDot",
  "maxConfidence",
  "capsLockBackspace",
  "showAvg",
  "enableAds",
];

export async function saveConfig(
  uid: string,
  config: Config
): Promise<UpdateResult> {
  const configChanges = _.mapKeys(config, (_value, key) => `config.${key}`);

  const unset = _.fromPairs(
    _.map(configLegacyProperties, (key) => [`config.${key}`, ""])
  ) as Record<string, "">;

  return await db
    .collection<Config>("configs")
    .updateOne(
      { uid },
      { $set: configChanges, $unset: unset },
      { upsert: true }
    );
}

export async function getConfig(uid: string): Promise<Config | null> {
  const config = await db.collection<Config>("configs").findOne({ uid });
  return config;
}

export async function deleteConfig(uid: string): Promise<void> {
  await db.collection<Config>("configs").deleteOne({ uid });
}
