import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { configMetadata } from "./metadata";
import { getDefaultConfig } from "../constants/default-config";
import { resetPendingConfigSync } from "./persistence";
import { Config } from "./store";

export const __testing = {
  configMetadata,
  replaceConfig: (setConfig: Partial<ConfigSchema>): void => {
    const newConfig = { ...getDefaultConfig(), ...setConfig };
    for (const key of Object.keys(Config)) {
      Reflect.deleteProperty(Config, key);
    }
    Object.assign(Config, newConfig);
    resetPendingConfigSync({});
  },
  getConfig: () => Config,
};
