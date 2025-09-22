import { Collection, ObjectId, UpdateResult } from "mongodb";
import * as db from "../init/db";
import { Config, PartialConfig } from "@monkeytype/schemas/configs";

const configLegacyProperties: Record<string, ""> = {
  "config.swapEscAndTab": "",
  "config.quickTab": "",
  "config.chartStyle": "",
  "config.chartAverage10": "",
  "config.chartAverage100": "",
  "config.alwaysShowCPM": "",
  "config.resultFilters": "",
  "config.chartAccuracy": "",
  "config.liveSpeed": "",
  "config.extraTestColor": "",
  "config.savedLayout": "",
  "config.showTimerBar": "",
  "config.showDiscordDot": "",
  "config.maxConfidence": "",
  "config.capsLockBackspace": "",
  "config.showAvg": "",
  "config.enableAds": "",
};

export type DBConfig = {
  _id: ObjectId;
  uid: string;
  config: PartialConfig;
};

const getConfigCollection = (): Collection<DBConfig> =>
  db.collection<DBConfig>("configs");

export async function saveConfig(
  uid: string,
  config: Partial<Config>
): Promise<UpdateResult> {
  const configChanges = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [`config.${key}`, value])
  );

  return await getConfigCollection().updateOne(
    { uid },
    { $set: configChanges, $unset: configLegacyProperties },
    { upsert: true }
  );
}

export async function getConfig(uid: string): Promise<DBConfig | null> {
  const config = await getConfigCollection().findOne({ uid });
  return config;
}

export async function deleteConfig(uid: string): Promise<void> {
  await getConfigCollection().deleteOne({ uid });
}

export const __testing = {
  getConfigCollection,
};
