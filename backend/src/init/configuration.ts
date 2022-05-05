import * as db from "./db";
import _ from "lodash";
import Logger from "../utils/logger";
import { identity } from "../utils/misc";
import BASE_CONFIGURATION from "../constants/base-configuration";
import { ObjectId } from "mongodb";

const CONFIG_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 Minutes

function mergeConfigurations(
  baseConfiguration: MonkeyTypes.Configuration,
  liveConfiguration: MonkeyTypes.Configuration
): void {
  if (
    !_.isPlainObject(baseConfiguration) ||
    !_.isPlainObject(liveConfiguration)
  ) {
    return;
  }

  function merge(base: object, source: object): void {
    const commonKeys = _.intersection(_.keys(base), _.keys(source));

    commonKeys.forEach((key) => {
      const baseValue = base[key];
      const sourceValue = source[key];

      const isBaseValueObject = _.isPlainObject(baseValue);
      const isSourceValueObject = _.isPlainObject(sourceValue);

      if (isBaseValueObject && isSourceValueObject) {
        merge(baseValue, sourceValue);
      } else if (identity(baseValue) === identity(sourceValue)) {
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
): Promise<MonkeyTypes.Configuration> {
  if (
    attemptCacheUpdate &&
    lastFetchTime < Date.now() - CONFIG_UPDATE_INTERVAL
  ) {
    Logger.info("Cached configuration is stale.");
    return await getLiveConfiguration();
  }

  return configuration;
}

export async function getLiveConfiguration(): Promise<MonkeyTypes.Configuration> {
  lastFetchTime = Date.now();

  const configurationCollection = db.collection("configuration");

  try {
    const liveConfiguration = await configurationCollection.findOne();

    if (liveConfiguration) {
      const baseConfiguration = _.cloneDeep(BASE_CONFIGURATION);

      const liveConfigurationWithoutId = _.omit(
        liveConfiguration,
        "_id"
      ) as MonkeyTypes.Configuration;
      mergeConfigurations(baseConfiguration, liveConfigurationWithoutId);

      pushConfiguration(baseConfiguration);
      configuration = baseConfiguration;
    } else {
      await configurationCollection.insertOne({
        ...BASE_CONFIGURATION,
        _id: new ObjectId(),
      }); // Seed the base configuration.
    }
  } catch (error) {
    Logger.logToDb(
      "fetch_configuration_failure",
      `Could not fetch configuration: ${error.message}`
    );
  }

  return configuration;
}

async function pushConfiguration(
  configuration: MonkeyTypes.Configuration
): Promise<void> {
  if (serverConfigurationUpdated) {
    return;
  }

  try {
    await db.collection("configuration").replaceOne({}, configuration);
    serverConfigurationUpdated = true;
  } catch (error) {
    Logger.logToDb(
      "push_configuration_failure",
      `Could not push configuration: ${error.message}`
    );
  }
}
