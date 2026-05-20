import * as db from "./db";
import { ObjectId } from "mongodb";
import Logger from "../utils/logger";
import { identity, isPlainObject, omit } from "../utils/misc";
import { BASE_CONFIGURATION } from "../constants/base-configuration";
import { Configuration } from "@monkeytype/schemas/configuration";
import { addLog } from "../dal/logs";
import {
  PartialConfiguration,
  PartialConfigurationSchema,
} from "@monkeytype/contracts/configuration";
import { getErrorMessage } from "../utils/error";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { z } from "zod";
import { intersect } from "@monkeytype/util/arrays";

const CONFIG_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 Minutes
const SERVER_CONFIG_FILE_PATH = join(
  __dirname,
  "../backend-configuration.json",
);

function mergeConfigurations(
  baseConfiguration: Configuration,
  liveConfiguration: PartialConfiguration,
): void {
  if (!isPlainObject(baseConfiguration) || !isPlainObject(liveConfiguration)) {
    return;
  }

  function merge(base: object, source: object): void {
    const commonKeys = intersect(Object.keys(base), Object.keys(source), true);

    commonKeys.forEach((key) => {
      const baseValue = base[key] as object;
      const sourceValue = source[key] as object;

      const isBaseValueObject = isPlainObject(baseValue);
      const isSourceValueObject = isPlainObject(sourceValue);

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
  attemptCacheUpdate = false,
): Promise<Configuration> {
  if (
    attemptCacheUpdate &&
    lastFetchTime < Date.now() - CONFIG_UPDATE_INTERVAL
  ) {
    Logger.info("Cached configuration is stale.");
    return await getLiveConfiguration();
  }

  return configuration;
}

export async function getLiveConfiguration(): Promise<Configuration> {
  lastFetchTime = Date.now();

  const configurationCollection = db.collection("configuration");

  try {
    const liveConfiguration = await configurationCollection.findOne();

    if (liveConfiguration) {
      const baseConfiguration = structuredClone(BASE_CONFIGURATION);

      const liveConfigurationWithoutId = omit(liveConfiguration, [
        "_id",
      ]) as Configuration;
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
    const errorMessage = getErrorMessage(error) ?? "Unknown error";
    void addLog(
      "fetch_configuration_failure",
      `Could not fetch configuration: ${errorMessage}`,
    );
  }

  return configuration;
}

async function pushConfiguration(
  configurationToPush: Configuration,
): Promise<void> {
  if (serverConfigurationUpdated) {
    return;
  }

  try {
    await db.collection("configuration").replaceOne({}, configurationToPush);
    serverConfigurationUpdated = true;
  } catch (error) {
    const errorMessage = getErrorMessage(error) ?? "Unknown error";
    void addLog(
      "push_configuration_failure",
      `Could not push configuration: ${errorMessage}`,
    );
  }
}

export async function patchConfiguration(
  configurationUpdates: PartialConfiguration,
): Promise<boolean> {
  try {
    const currentConfiguration = structuredClone(configuration);
    mergeConfigurations(currentConfiguration, configurationUpdates);

    await db
      .collection("configuration")
      .updateOne({}, { $set: currentConfiguration }, { upsert: true });

    await getLiveConfiguration();
  } catch (error) {
    const errorMessage = getErrorMessage(error) ?? "Unknown error";
    void addLog(
      "patch_configuration_failure",
      `Could not patch configuration: ${errorMessage}`,
    );

    return false;
  }

  return true;
}

export async function updateFromConfigurationFile(): Promise<void> {
  if (existsSync(SERVER_CONFIG_FILE_PATH)) {
    Logger.info(
      `Reading server configuration from file ${SERVER_CONFIG_FILE_PATH}`,
    );
    const json = readFileSync(SERVER_CONFIG_FILE_PATH, "utf-8");
    const data = parseJsonWithSchema(
      json,
      z.object({
        configuration: PartialConfigurationSchema,
      }),
    );

    await patchConfiguration(data.configuration);
  }
}

export const __testing = {
  mergeConfigurations,
};
