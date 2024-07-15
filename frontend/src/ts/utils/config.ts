import { Config, PartialConfig } from "shared/contracts/configs";
import DefaultConfig from "../constants/default-config";
import { typedKeys } from "./misc";

export function mergeWithDefaultConfig(config: PartialConfig): Config {
  const mergedConfig = {} as SharedTypes.Config;
  for (const key of typedKeys(DefaultConfig)) {
    const newValue =
      config[key] ?? (DefaultConfig[key] as SharedTypes.ConfigValue);
    //@ts-expect-error cant be bothered to deal with this
    mergedConfig[key] = newValue;
  }
  return mergedConfig;
}
