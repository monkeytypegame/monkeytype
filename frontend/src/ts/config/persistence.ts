import { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { saveConfig } from "../ape/config";
import { setAccountButtonSpinner } from "../states/header";
import { getConfigSnapshot } from "./store";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { migrateConfig } from "./utils";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { isObject } from "../utils/misc";
import { debounce } from "throttle-debounce";

let configToSend: Partial<ConfigSchemas.Config> = {};

export const configLS = new LocalStorageWithSchema({
  key: "config",
  schema: ConfigSchemas.ConfigSchema,
  fallback: getDefaultConfig(),
  migrate: (value, _issues) => {
    if (!isObject(value)) {
      return getDefaultConfig();
    }
    //todo maybe send a full config to db so that it removes legacy values
    return migrateConfig(value);
  },
});

export function saveToLocalStorage(
  key: keyof ConfigSchema,
  nosave = false,
  noDbCheck = false,
): void {
  if (nosave) return;
  const config = getConfigSnapshot();
  configLS.set(config);
  if (!noDbCheck) {
    //@ts-expect-error this is fine
    configToSend[key] = config[key];
    saveToDatabase();
  }
}

export function saveFullConfigToLocalStorage(noDbCheck = false): void {
  console.log("saving full config to localStorage");
  const config = getConfigSnapshot();
  configLS.set(config);
  if (!noDbCheck) {
    setAccountButtonSpinner(true);
    void saveConfig(config).finally(() => {
      setAccountButtonSpinner(false);
    });
  }
}

const saveToDatabase = debounce(1000, () => {
  if (Object.keys(configToSend).length > 0) {
    setAccountButtonSpinner(true);
    void saveConfig(configToSend).finally(() => {
      setAccountButtonSpinner(false);
    });
  }
  configToSend = {};
});

export function resetPendingConfigSync(
  newConfigToSend: Partial<ConfigSchemas.Config>,
): void {
  configToSend = newConfigToSend;
}
