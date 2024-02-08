import DefaultConfig from "../constants/default-config";
import { typedKeys } from "./misc";

export function mergeWithDefaultConfig(
  config: Partial<SharedTypes.Config>
): SharedTypes.Config {
  const mergedConfig = {} as SharedTypes.Config;
  for (const key of typedKeys(DefaultConfig)) {
    const newValue =
      config[key] ?? (DefaultConfig[key] as SharedTypes.ConfigValue);
    //@ts-ignore cant be bothered to deal with this
    mergedConfig[key] = newValue;
  }
  return mergedConfig;
}
