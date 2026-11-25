import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { DeepReadonly } from "../utils/types";
import { createStore, reconcile, unwrap } from "solid-js/store";

const [getConfigStore, setConfigStoreRaw] =
  createStore<ConfigSchema>(getDefaultConfig());

// the store object itself, not a getter function: read `getConfig.fontSize`.
// Read-only: write with setConfig. Its arrays update in place, so copy one
// that must keep its value past a write (eg. a value to roll back to)
export const getConfig: DeepReadonly<ConfigSchema> = getConfigStore;

/** A plain copy of the config, for code that keeps or sends it whole. */
export function getConfigSnapshot(): ConfigSchema {
  return structuredClone(unwrap(getConfigStore));
}

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
