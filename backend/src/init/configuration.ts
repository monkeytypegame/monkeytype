import * as db from "./db";
import { ObjectId } from "mongodb";
import Logger from "../utils/logger";
import { BASE_CONFIGURATION } from "../constants/base-configuration";

const CONFIG_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 Minutes

function mergeConfigurations(
  baseConfiguration: SharedTypes.Configuration,
  liveConfiguration: Partial<SharedTypes.Configuration>
): void {
  if (
    typeof baseConfiguration !== 'object' ||
    typeof liveConfiguration !== 'object'
  ) {
    return;
  }

  function merge(base: object, source: object): void {
    const commonKeys = Object.keys(base).filter(key => key in source);

    commonKeys.forEach((key) => {
      const baseValue = base[key];
      const sourceValue = source[key];

      const isBaseValueObject = typeof baseValue === 'object';
      const isSourceValueObject = typeof sourceValue === 'object';

      if (isBaseValueObject && isSourceValueObject) {
        merge(baseValue, sourceValue);
      } else if (baseValue === sourceValue) {
        base[key] = sourceValue;
      }
    });
  }

  merge(baseConfiguration, liveConfiguration);
}

let configuration = BASE_CONFIGURATION;
let lastFetchTime = 0;
let serverConfigurationUpdated = false;

export async function getCachedConfiguration(
  attemptCacheUpdate = false
): Promise<SharedTypes.Configuration> {
  if (
    attemptCacheUpdate &&
    lastFetchTime < Date.now() - CONFIG_UPDATE_INTERVAL
  ) {
    Logger.info("Cached configuration is stale.");
    return await getLiveConfiguration();
  }

  return configuration;
}

export async function getLiveConfiguration(): Promise<SharedTypes.Configuration> {
  lastFetchTime = Date.now();

  const configurationCollection = db.collection("configuration");

  try {
    const liveConfiguration = await configurationCollection.findOne();

    if (liveConfiguration) {
      const baseConfiguration = JSON.parse(JSON.stringify(BASE_CONFIGURATION));

      const liveConfigurationWithoutId = { ...liveConfiguration, _id: undefined };
      mergeConfigurations(baseConfiguration, liveConfigurationWithoutId);

      await pushConfiguration(baseConfiguration);
      configuration = baseConfiguration;
    } else {
      await configurationCollection.insertOne({
        ...BASE_CONFIGURATION,
        _id: new ObjectId(),
      }); // Seed the base configuration.
    }
  } catch (error) {
    void Logger.logToDb(
      "fetch_configuration_failure",
      `Could not fetch configuration: ${error.message}`
    );
  }

  return configuration;
}

async function pushConfiguration(
  configuration: SharedTypes.Configuration
): Promise<void> {
  if (serverConfigurationUpdated) {
    return;
  }

  try {
    await db.collection("configuration").replaceOne({}, configuration);
    serverConfigurationUpdated = true;
  } catch (error) {
    void Logger.logToDb(
      "push_configuration_failure",
      `Could not push configuration: ${error.message}`
    );
  }
}

export async function patchConfiguration(
  configurationUpdates: Partial<SharedTypes.Configuration>
): Promise<boolean> {
  try {
    const currentConfiguration = JSON.parse(JSON.stringify(configuration));
    mergeConfigurations(currentConfiguration, configurationUpdates);

    await db
      .collection("configuration")
      .updateOne({}, { $set: currentConfiguration }, { upsert: true });

    await getLiveConfiguration();
  } catch (error) {
    void Logger.logToDb(
      "patch_configuration_failure",
      `Could not patch configuration: ${error.message}`
    );

    return false;
  }

  return true;
}
