import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { configMetadata } from "./metadata";
import { getDefaultConfig } from "../constants/default-config";
import { resetPendingConfigSync } from "./persistence";
import { getConfigSnapshot, setFullConfigStore } from "./store";

export const __testing = {
  configMetadata,
  replaceConfig: (setConfig: Partial<ConfigSchema>): void => {
    setFullConfigStore({ ...getDefaultConfig(), ...setConfig });
    resetPendingConfigSync({});
  },
  getConfig: getConfigSnapshot,
};
