import { Config } from "@monkeytype/schemas/configs";
import { configMetadata } from "../config-metadata";
import { getDefaultConfig } from "../constants/default-config";
import { setConfigToSendPersistence } from "./persistence";
import config from "./store";

export const __testing = {
  configMetadata,
  replaceConfig: (setConfig: Partial<Config>): void => {
    const newConfig = { ...getDefaultConfig(), ...setConfig };
    for (const key of Object.keys(config)) {
      Reflect.deleteProperty(config, key);
    }
    Object.assign(config, newConfig);
    setConfigToSendPersistence({} as Config);
  },
  getConfig: () => config,
};
