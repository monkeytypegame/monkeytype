import db from "./db";
import _ from "lodash";
import Logger from "../utils/logger";
import { identity } from "../utils/misc";
import BASE_CONFIGURATION from "../constants/base-configuration";

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

class ConfigurationClient {
  static configuration: MonkeyTypes.Configuration = BASE_CONFIGURATION;
  static lastFetchTime = 0;
  static databaseConfigurationUpdated = false;

  static async getCachedConfiguration(
    attemptCacheUpdate = false
  ): Promise<MonkeyTypes.Configuration> {
    if (
      attemptCacheUpdate &&
      this.lastFetchTime < Date.now() - CONFIG_UPDATE_INTERVAL
    ) {
      console.log("Cached configuration is stale.");
      return await this.getLiveConfiguration();
    }
    return this.configuration;
  }

  static async getLiveConfiguration(): Promise<MonkeyTypes.Configuration> {
    this.lastFetchTime = Date.now();

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

        this.pushConfiguration(baseConfiguration);
        this.configuration = baseConfiguration;
      } else {
        await configurationCollection.insertOne(BASE_CONFIGURATION); // Seed the base configuration.
      }
    } catch (error) {
      Logger.log(
        "fetch_configuration_failure",
        `Could not fetch configuration: ${error.message}`
      );
    }

    return this.configuration;
  }

  static async pushConfiguration(
    configuration: MonkeyTypes.Configuration
  ): Promise<void> {
    if (this.databaseConfigurationUpdated) {
      return;
    }

    try {
      await db.collection("configuration").replaceOne({}, configuration);

      this.databaseConfigurationUpdated = true;
    } catch (error) {
      Logger.log(
        "push_configuration_failure",
        `Could not push configuration: ${error.message}`
      );
    }
  }
}

export default ConfigurationClient;
