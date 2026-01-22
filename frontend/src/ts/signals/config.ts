import { subscribe } from "../observables/config-event";
import { Config as ConfigType } from "@monkeytype/schemas/configs";
import { createStore } from "solid-js/store";
import { getDefaultConfig } from "../constants/default-config";
import * as Config from "../config";

const [getConfig, setConfigStore] = createStore<ConfigType>(getDefaultConfig());
export { getConfig };

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
