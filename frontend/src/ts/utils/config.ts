import DefaultConfig from "../constants/default-config";
import { typedKeys } from "./misc";

export function mergeWithDefaultConfig(
  config: Partial<MonkeyTypes.Config>
): MonkeyTypes.Config {
  const mergedConfig = {} as MonkeyTypes.Config;
  for (const key of typedKeys(DefaultConfig)) {
    const newValue =
      config[key] ?? (DefaultConfig[key] as MonkeyTypes.ConfigValue);
    //@ts-ignore cant be bothered to deal with this
    mergedConfig[key] = newValue;
  }
  return mergedConfig;
}
