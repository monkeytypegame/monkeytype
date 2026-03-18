import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { createStore } from "solid-js/store";
import { subscribe } from "../observables/config-event";

const Config: ConfigSchema = {
  ...getDefaultConfig(),
};

const [getConfig, setConfigStore] =
  createStore<ConfigSchema>(getDefaultConfig());

let fullConfigChange = false;
subscribe(({ key, newValue }) => {
  if (key === "fullConfigChange") {
    fullConfigChange = true;
  } else if (key === "fullConfigChangeFinished") {
    fullConfigChange = false;
    setConfigStore(Config);
  } else if (fullConfigChange) {
    return;
  } else {
    setConfigStore(key, newValue);
  }
});

export { Config, getConfig };
