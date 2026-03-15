import { Config } from "@monkeytype/schemas/configs";
import {
  configLS,
  saveToLocalStorage,
  saveFullConfigToLocalStorage,
} from "./persistence";
import config, { loadDone } from "./store";
import { getDefaultConfig } from "../constants/default-config";
import * as ConfigEvent from "../observables/config-event";
import { migrateConfig } from "../utils/config";
import { typedKeys } from "../utils/misc";
import { setConfig } from "./setters";
import { deleteConfig } from "../ape/config";

export async function loadFromLocalStorage(): Promise<void> {
  console.log("loading localStorage config");
  const newConfig = configLS.get();
  if (newConfig === undefined) {
    await resetConfig();
  } else {
    await applyConfig(newConfig);
    saveFullConfigToLocalStorage(true);
  }
  loadDone();
}
export const lastConfigsToApply: Set<keyof Config> = new Set([
  "keymapMode",
  "minWpm",
  "minAcc",
  "minBurst",
  "paceCaret",
  "quoteLength", //quote length sets mode,
  "words",
  "time",
  "mode", // mode sets punctuation and numbers
  "numbers",
  "punctuation",
  "funbox",
]);
export async function applyConfig(
  partialConfig: Partial<Config>,
): Promise<void> {
  if (partialConfig === undefined || partialConfig === null) return;

  //migrate old values if needed, remove additional keys and merge with default config
  const fullConfig: Config = migrateConfig(partialConfig);

  ConfigEvent.dispatch({ key: "fullConfigChange" });

  const defaultConfig = getDefaultConfig();
  for (const key of typedKeys(fullConfig)) {
    //@ts-expect-error this is fine, both are of type config
    config[key] = defaultConfig[key];
  }

  const configKeysToReset: (keyof Config)[] = [];

  const firstKeys = typedKeys(fullConfig).filter(
    (key) => !lastConfigsToApply.has(key),
  );

  for (const configKey of [...firstKeys, ...lastConfigsToApply]) {
    const configValue = fullConfig[configKey];

    const set = setConfig(configKey, configValue, { nosave: true });

    if (!set) {
      configKeysToReset.push(configKey);
    }
  }

  for (const key of configKeysToReset) {
    saveToLocalStorage(key);
  }

  ConfigEvent.dispatch({ key: "fullConfigChangeFinished" });
}
export async function resetConfig(): Promise<void> {
  await applyConfig(getDefaultConfig());
  await deleteConfig();
  saveFullConfigToLocalStorage(true);
}

export function getConfigChanges(): Partial<Config> {
  const configChanges: Partial<Config> = {};
  typedKeys(config)
    .filter((key) => {
      return config[key] !== getDefaultConfig()[key];
    })
    .forEach((key) => {
      //@ts-expect-error this is fine
      configChanges[key] = config[key];
    });
  return configChanges;
}
