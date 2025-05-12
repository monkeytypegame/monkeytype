import {
  Config,
  ConfigValue,
  PartialConfig,
  FunboxName,
} from "@monkeytype/contracts/schemas/configs";
import { typedKeys } from "./misc";
import * as ConfigSchemas from "@monkeytype/contracts/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
/**
 * migrates possible outdated config and merges with the default config values
 * @param config partial or possible outdated config
 * @returns
 */
export function migrateConfig(config: PartialConfig | object): Config {
  return mergeWithDefaultConfig(sanitizeConfig(replaceLegacyValues(config)));
}

function mergeWithDefaultConfig(config: PartialConfig): Config {
  const defaultConfig = getDefaultConfig();
  const mergedConfig = {} as Config;
  for (const key of typedKeys(defaultConfig)) {
    const newValue = config[key] ?? (defaultConfig[key] as ConfigValue);
    //@ts-expect-error cant be bothered to deal with this
    mergedConfig[key] = newValue;
  }
  return mergedConfig;
}

/**
 * remove all values from the config which are not valid
 */
function sanitizeConfig(
  config: ConfigSchemas.PartialConfig
): ConfigSchemas.PartialConfig {
  const validate = ConfigSchemas.PartialConfigSchema.safeParse(config);

  if (validate.success) {
    return config;
  }

  const errors: Map<string, number[] | undefined> = new Map();
  for (const error of validate.error.errors) {
    const element = error.path[0] as string;
    let val = errors.get(element);
    if (typeof error.path[1] === "number") {
      val = [...(val ?? []), error.path[1]];
    }
    errors.set(element, val);
  }

  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      if (!errors.has(key)) {
        return [key, value];
      }

      const error = errors.get(key);

      if (
        Array.isArray(value) &&
        error !== undefined && //error is not on the array itself
        error.length < value.length //not all items in the array are invalid
      ) {
        //some items of the array are invalid
        return [key, value.filter((_element, index) => !error.includes(index))];
      } else {
        return [key, undefined];
      }
    })
  ) as ConfigSchemas.PartialConfig;
}

export function replaceLegacyValues(
  configObj: ConfigSchemas.PartialConfig
): ConfigSchemas.PartialConfig {
  //@ts-expect-error legacy configs
  if (configObj.quickTab === true && configObj.quickRestart === undefined) {
    configObj.quickRestart = "tab";
  }

  if (typeof configObj.smoothCaret === "boolean") {
    configObj.smoothCaret = configObj.smoothCaret ? "medium" : "off";
  }

  if (
    //@ts-expect-error legacy configs
    configObj.swapEscAndTab === true &&
    configObj.quickRestart === undefined
  ) {
    configObj.quickRestart = "esc";
  }

  if (
    //@ts-expect-error legacy configs
    configObj.alwaysShowCPM === true &&
    configObj.typingSpeedUnit === undefined
  ) {
    configObj.typingSpeedUnit = "cpm";
  }

  //@ts-expect-error legacy configs
  if (configObj.showAverage === "wpm") {
    configObj.showAverage = "speed";
  }

  if (typeof configObj.playSoundOnError === "boolean") {
    configObj.playSoundOnError = configObj.playSoundOnError ? "1" : "off";
  }

  if (
    //@ts-expect-error legacy configs
    configObj.showTimerProgress === false &&
    configObj.timerStyle === undefined
  ) {
    configObj.timerStyle = "off";
  }

  if (
    //@ts-expect-error legacy configs
    configObj.showLiveWpm === true &&
    configObj.liveSpeedStyle === undefined
  ) {
    let val: ConfigSchemas.LiveSpeedAccBurstStyle = "mini";
    if (configObj.timerStyle !== "bar" && configObj.timerStyle !== "off") {
      val = configObj.timerStyle as ConfigSchemas.LiveSpeedAccBurstStyle;
    }
    configObj.liveSpeedStyle = val;
  }

  if (
    //@ts-expect-error legacy configs
    configObj.showLiveBurst === true &&
    configObj.liveBurstStyle === undefined
  ) {
    let val: ConfigSchemas.LiveSpeedAccBurstStyle = "mini";
    if (configObj.timerStyle !== "bar" && configObj.timerStyle !== "off") {
      val = configObj.timerStyle as ConfigSchemas.LiveSpeedAccBurstStyle;
    }
    configObj.liveBurstStyle = val;
  }

  if (
    //@ts-expect-error legacy configs
    configObj.showLiveAcc === true &&
    configObj.liveAccStyle === undefined
  ) {
    let val: ConfigSchemas.LiveSpeedAccBurstStyle = "mini";
    if (configObj.timerStyle !== "bar" && configObj.timerStyle !== "off") {
      val = configObj.timerStyle as ConfigSchemas.LiveSpeedAccBurstStyle;
    }
    configObj.liveAccStyle = val;
  }

  if (typeof configObj.soundVolume === "string") {
    configObj.soundVolume = parseFloat(configObj.soundVolume);
  }

  if (typeof configObj.funbox === "string") {
    if (configObj.funbox === "none") {
      configObj.funbox = [];
    } else {
      configObj.funbox = (configObj.funbox as string).split(
        "#"
      ) as FunboxName[];
    }
  }

  if (typeof configObj.customLayoutfluid === "string") {
    configObj.customLayoutfluid = (configObj.customLayoutfluid as string).split(
      "#"
    ) as ConfigSchemas.CustomLayoutFluid;
  }

  if (typeof configObj.indicateTypos === "boolean") {
    configObj.indicateTypos =
      configObj.indicateTypos === false ? "off" : "replace";
  }

  return configObj;
}
