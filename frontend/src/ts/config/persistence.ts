import { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { saveConfig } from "../ape/config";
import { setAccountButtonSpinner } from "../states/header";
import { Config } from "./store";
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
  configLS.set(Config);
  if (!noDbCheck) {
    //@ts-expect-error this is fine
    configToSend[key] = Config[key];
    saveToDatabase();
  }
}

export function saveFullConfigToLocalStorage(noDbCheck = false): void {
  console.log("saving full config to localStorage");
  configLS.set(Config);
  if (!noDbCheck) {
    setAccountButtonSpinner(true);
    void saveConfig(Config).finally(() => {
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
