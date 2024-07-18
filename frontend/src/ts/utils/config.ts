import DefaultConfig from "../constants/default-config.js";
import { typedKeys } from "./misc.js";

export function mergeWithDefaultConfig(
  config: Partial<SharedTypes.Config>
): SharedTypes.Config {
  const mergedConfig = {} as SharedTypes.Config;
  for (const key of typedKeys(DefaultConfig)) {
    const newValue =
      config[key] ?? (DefaultConfig[key] as SharedTypes.ConfigValue);
    //@ts-expect-error cant be bothered to deal with this
    mergedConfig[key] = newValue;
  }
  return mergedConfig;
}
