import { Config, ConfigValue } from "@monkeytype/shared-types/config";
import DefaultConfig from "../constants/default-config";
import { typedKeys } from "./misc";
import { PartialConfig } from "@monkeytype/contracts/schemas/configs";

export function mergeWithDefaultConfig(config: PartialConfig): Config {
  const mergedConfig = {} as Config;
  for (const key of typedKeys(DefaultConfig)) {
    const newValue = config[key] ?? (DefaultConfig[key] as ConfigValue);
    //@ts-expect-error cant be bothered to deal with this
    mergedConfig[key] = newValue;
  }
  return mergedConfig;
}
