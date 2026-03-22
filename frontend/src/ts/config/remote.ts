import * as ConfigSchemas from "@monkeytype/schemas/configs";

import { migrateConfig } from "./utils";
import { applyConfig } from "./lifecycle";
import { saveFullConfigToLocalStorage } from "./persistence";
import Ape from "../ape";
import { SnapshotInitError } from "../db";
import { getDefaultConfig } from "../constants/default-config";
import { Config } from "./store";

export async function updateFromServer(): Promise<void> {
  const remoteConfig = await getRemoteConfig();

  const areConfigsEqual =
    JSON.stringify(Config) === JSON.stringify(remoteConfig);

  if (Config === undefined || !areConfigsEqual) {
    console.log(
      "no local config or local and db configs are different - applying db",
    );
    await applyConfig(remoteConfig);
    saveFullConfigToLocalStorage(true);
  }
}

async function getRemoteConfig(): Promise<ConfigSchemas.Config> {
  const response = await Ape.configs.get();

  if (response.status !== 200) {
    throw new SnapshotInitError(
      `${response.body.message} (config)`,
      response.status,
    );
  }

  const configData = response.body.data;
  if (configData !== null && "config" in configData) {
    throw new Error(
      "Config data is not in the correct format. Please refresh the page or contact support.",
    );
  }

  if (configData === undefined || configData === null) {
    return {
      ...getDefaultConfig(),
    };
  } else {
    return migrateConfig(configData);
  }
}
