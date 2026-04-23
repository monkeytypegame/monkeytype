import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { createStore, reconcile } from "solid-js/store";

export const Config: ConfigSchema = {
  ...getDefaultConfig(),
};

const [getConfigStore, setConfigStoreRaw] =
  createStore<ConfigSchema>(getDefaultConfig());

export const getConfig = getConfigStore;

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
