import { Collection, UpdateResult } from "mongodb";
import * as db from "../init/db";
import _ from "lodash";
import { Config } from "@shared/contract/configs.contract";

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

// Export for use in tests
export const getConfigCollection = (): Collection<MonkeyTypes.DBConfig> =>
  db.collection<MonkeyTypes.DBConfig>("configs");

export async function saveConfig(
  uid: string,
  config: Partial<Config>
): Promise<UpdateResult> {
  const configChanges = _.mapKeys(config, (_value, key) => `config.${key}`);

  const unset = _.fromPairs(
    _.map(configLegacyProperties, (key) => [`config.${key}`, ""])
  ) as Record<string, "">;

  return await getConfigCollection().updateOne(
    { uid },
    { $set: configChanges, $unset: unset },
    { upsert: true }
  );
}

export async function getConfig(
  uid: string
): Promise<MonkeyTypes.DBConfig | null> {
  const config = await getConfigCollection().findOne({ uid });
  return config;
}

export async function deleteConfig(uid: string): Promise<void> {
  await getConfigCollection().deleteOne({ uid });
}
