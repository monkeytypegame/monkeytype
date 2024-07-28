import { Config, ConfigValue } from "@monkeytype/shared-types/config";
import DefaultConfig from "../constants/default-config";
import { typedKeys } from "./misc";

export function mergeWithDefaultConfig(config: Partial<Config>): Config {
  const mergedConfig = {} as Config;
  for (const key of typedKeys(DefaultConfig)) {
    const newValue = config[key] ?? (DefaultConfig[key] as ConfigValue);
    //@ts-expect-error cant be bothered to deal with this
    mergedConfig[key] = newValue;
  }
  return mergedConfig;
}
