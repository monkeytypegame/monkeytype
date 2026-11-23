import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { DeepReadonly } from "../utils/types";
import { createStore, reconcile } from "solid-js/store";

export const Config: ConfigSchema = {
  ...getDefaultConfig(),
};

const [getConfigStore, setConfigStoreRaw] =
  createStore<ConfigSchema>(getDefaultConfig());

// the store object itself, not a getter function: read `getConfig.fontSize`.
// Read-only: write with setConfig. Its arrays update in place, so copy one
// that must keep its value past a write (eg. a value to roll back to)
export const getConfig: DeepReadonly<ConfigSchema> = getConfigStore;

export function setFullConfigStore(newConfig: ConfigSchema): void {
  setConfigStoreRaw(reconcile(newConfig));
}

export function setConfigStore<K extends keyof ConfigSchema>(
  key: K,
  value: ConfigSchema[K],
): void {
  if (Array.isArray(value)) {
    setConfigStoreRaw(key, reconcile(value));
  } else {
    setConfigStoreRaw(key, value);
  }
}

// window.getConfigStore = getConfigStore;
