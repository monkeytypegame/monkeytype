const _ = require("lodash");
const db = require("../init/db");
const BASE_CONFIGURATION = require("../constants/base-configuration");
const Logger = require("../handlers/logger.js");

const CONFIG_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 Minutes

function mergeConfigurations(baseConfiguration, liveConfiguration) {
  if (
    !_.isPlainObject(baseConfiguration) ||
    !_.isPlainObject(liveConfiguration)
  ) {
    return;
  }

  function merge(base, source) {
    const commonKeys = _.intersection(_.keys(base), _.keys(source));

    commonKeys.forEach((key) => {
      const baseValue = base[key];
      const sourceValue = source[key];

      const isBaseValueObject = _.isPlainObject(baseValue);
      const isSourceValueObject = _.isPlainObject(sourceValue);
      const isBaseValueArray = _.isArray(baseValue);
      const isSourceValueArray = _.isArray(sourceValue);

      const arrayObjectMismatch =
        (isBaseValueObject && isSourceValueArray) ||
        (isBaseValueArray && isSourceValueObject);

      if (isBaseValueObject && isSourceValueObject) {
        merge(baseValue, sourceValue);
      } else if (
        typeof baseValue === typeof sourceValue &&
        !arrayObjectMismatch // typeof {} = "object", typeof [] = "object"
      ) {
        base[key] = sourceValue;
      }
    });
  }

  merge(baseConfiguration, liveConfiguration);
}

class ConfigurationDAO {
  static configuration = BASE_CONFIGURATION;
  static lastFetchTime = 0;
  static databaseConfigurationUpdated = false;

  static async getCachedConfiguration(attemptCacheUpdate = false) {
    if (
      attemptCacheUpdate &&
      this.lastFetchTime < Date.now() - CONFIG_UPDATE_INTERVAL
    ) {
      Logger.log("stale_configuration", "Cached configuration is stale.");
      return await this.getLiveConfiguration();
    }
    return this.configuration;
  }

  static async getLiveConfiguration() {
    this.lastFetchTime = Date.now();

    const configurationCollection = db.collection("configuration");

    try {
      const liveConfiguration = await configurationCollection.findOne();

      if (liveConfiguration) {
        const baseConfiguration = _.cloneDeep(BASE_CONFIGURATION);
        mergeConfigurations(baseConfiguration, liveConfiguration);

        this.pushConfiguration(baseConfiguration);
        this.configuration = Object.freeze(baseConfiguration);
      } else {
        await configurationCollection.insertOne(
          Object.assign({}, BASE_CONFIGURATION)
        ); // Seed the base configuration.
      }

      Logger.log(
        "fetch_configuration_success",
        "Successfully fetched live configuration."
      );
    } catch (error) {
      Logger.log(
        "fetch_configuration_failure",
        `Could not fetch configuration: ${error.message}`
      );
    }

    return this.configuration;
  }

  static async pushConfiguration(configuration) {
    if (this.databaseConfigurationUpdated) {
      return;
    }

    const configurationCollection = db.collection("configuration");

    try {
      await configurationCollection.replaceOne({}, configuration);

      this.databaseConfigurationUpdated = true;
    } catch (error) {
      Logger.log(
        "push_configuration_failure",
        `Could not push configuration: ${error.message}`
      );
    }
  }
}

module.exports = ConfigurationDAO;
