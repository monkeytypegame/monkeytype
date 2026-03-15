import { subscribe } from "../observables/config-event";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import { createStore } from "solid-js/store";
import { getDefaultConfig } from "../constants/default-config";
import { getConfig as getLegacyConfig } from "../config";

const [getConfig, setConfigStore] = createStore<ConfigType>(getDefaultConfig());
export { getConfig };

let fullConfigChange = false;
subscribe(({ key, newValue }) => {
  if (key === "fullConfigChange") {
    fullConfigChange = true;
  } else if (key === "fullConfigChangeFinished") {
    fullConfigChange = false;
    setConfigStore(getLegacyConfig());
  } else if (fullConfigChange) {
    return;
  } else {
    setConfigStore(key, newValue);
  }
});
