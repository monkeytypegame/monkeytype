const _ = require("lodash");
const { mongoDB } = require("../init/mongodb");
const BASE_CONFIGURATION = require("../constants/base-configuration");
const Logger = require("../handlers/logger.js");

const CONFIG_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 Minutes

let databaseConfiguratoinUpdated = false;

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

      if (_.isPlainObject(baseValue) && _.isPlainObject(sourceValue)) {
        merge(baseValue, sourceValue);
      } else if (typeof baseValue === typeof sourceValue) {
        base[key] = sourceValue;
      }
    });
  }

  merge(baseConfiguration, liveConfiguration);
}

class ConfigurationDAO {
  static configuration = Object.freeze(BASE_CONFIGURATION);
  static lastFetchTime = 0;

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

    try {
      const liveConfiguration = await mongoDB()
        .collection("configuration")
        .findOne();

      if (liveConfiguration) {
        const baseConfiguration = _.cloneDeep(BASE_CONFIGURATION);
        mergeConfigurations(baseConfiguration, liveConfiguration);

        this.configuration = baseConfiguration;

        if (!databaseConfiguratoinUpdated) {
          await mongoDB()
            .collection("configuration")
            .updateOne({}, { $set: Object.assign({}, this.configuration) });
          databaseConfiguratoinUpdated = true;
        }
      } else {
        await mongoDB()
          .collection("configuration")
          .insertOne(Object.assign({}, BASE_CONFIGURATION)); // Seed the base configuration.
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

    this.configuration = Object.freeze(this.configuration);

    return this.configuration;
  }
}

module.exports = ConfigurationDAO;
