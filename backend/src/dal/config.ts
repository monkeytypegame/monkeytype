import { UpdateResult } from "mongodb";
import * as db from "../init/db";
import _ from "lodash";

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
  config: SharedTypes.Config
): Promise<UpdateResult> {
  const configChanges = _.mapKeys(config, (_value, key) => `config.${key}`);

  const unset = _.fromPairs(
    _.map(configLegacyProperties, (key) => [`config.${key}`, ""])
  );

  return await db.collection<SharedTypes.Config>("configs").updateOne(
    { uid },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { $set: configChanges, $unset: unset as any },
    { upsert: true }
  );
}

export async function getConfig(
  uid: string
): Promise<SharedTypes.Config | null> {
  const config = await db
    .collection<SharedTypes.Config>("configs")
    .findOne({ uid });
  return config;
}

export async function deleteConfig(uid: string): Promise<void> {
  await db.collection<SharedTypes.Config>("configs").deleteOne({ uid });
}
