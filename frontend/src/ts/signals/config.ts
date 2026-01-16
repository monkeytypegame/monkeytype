import { subscribe } from "../observables/config-event";
import {
  Config as ConfigType,
  ConfigKey,
  ConfigValue,
} from "@monkeytype/schemas/configs";
import { createStore } from "solid-js/store";
import { getDefaultConfig } from "../constants/default-config";
import * as Config from "../config";

const [getConfig, setConfigStore] = createStore<ConfigType>(getDefaultConfig());
export { getConfig };

// Function eventually will set the store directly
export function setSetConfig(key: ConfigKey, value: ConfigValue): void {
  Config.setConfig(key, value);
}

let fullConfigChange = false;
subscribe(({ key, newValue }) => {
  if (key === "fullConfigChange") {
    fullConfigChange = true;
  } else if (key === "fullConfigChangeFinished") {
    fullConfigChange = false;
    setConfigStore(Config.getConfig());
  } else if (fullConfigChange) {
    return;
  } else {
    setConfigStore(key, newValue);
  }
});
