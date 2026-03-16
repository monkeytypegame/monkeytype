import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import {
  configLS,
  saveToLocalStorage,
  saveFullConfigToLocalStorage,
} from "./persistence";
import { Config } from "./store";
import { getDefaultConfig } from "../constants/default-config";
import * as ConfigEvent from "../observables/config-event";
import { migrateConfig } from "./utils";
import { promiseWithResolvers, typedKeys } from "../utils/misc";
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
export const lastConfigsToApply: Set<keyof ConfigSchema> = new Set([
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
  partialConfig: Partial<ConfigSchema>,
): Promise<void> {
  if (partialConfig === undefined || partialConfig === null) return;

  //migrate old values if needed, remove additional keys and merge with default config
  const fullConfig: ConfigSchema = migrateConfig(partialConfig);

  ConfigEvent.dispatch({ key: "fullConfigChange" });

  const defaultConfig = getDefaultConfig();
  for (const key of typedKeys(fullConfig)) {
    //@ts-expect-error this is fine, both are of type config
    Config[key] = defaultConfig[key];
  }

  const configKeysToReset: (keyof ConfigSchema)[] = [];

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
const { promise: configLoadPromise, resolve: loadDone } =
  promiseWithResolvers();

export { configLoadPromise };
