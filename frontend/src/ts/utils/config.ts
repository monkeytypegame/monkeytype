import {
  Config,
  ConfigValue,
  PartialConfig,
} from "@monkeytype/contracts/schemas/configs";
import DefaultConfig from "../constants/default-config";
import { typedKeys } from "./misc";
import * as ConfigSchemas from "@monkeytype/contracts/schemas/configs";

/**
 * migrates possible outdated config and merges with the default config values
 * @param config partial or possible outdated config
 * @returns
 */
export function migrateConfig(config: PartialConfig | object): Config {
  return mergeWithDefaultConfig(replaceLegacyValues(config));
}

function mergeWithDefaultConfig(config: PartialConfig): Config {
  const mergedConfig = {} as Config;
  for (const key of typedKeys(DefaultConfig)) {
    const newValue = config[key] ?? (DefaultConfig[key] as ConfigValue);
    //@ts-expect-error cant be bothered to deal with this
    mergedConfig[key] = newValue;
  }
  return mergedConfig;
}

function replaceLegacyValues(
  configObj: ConfigSchemas.PartialConfig
): ConfigSchemas.PartialConfig {
  //@ts-expect-error
  if (configObj.quickTab === true) {
    configObj.quickRestart = "tab";
  }

  if (typeof configObj.smoothCaret === "boolean") {
    configObj.smoothCaret = configObj.smoothCaret ? "medium" : "off";
  }

  //@ts-expect-error
  if (configObj.swapEscAndTab === true) {
    configObj.quickRestart = "esc";
  }

  //@ts-expect-error
  if (configObj.alwaysShowCPM === true) {
    configObj.typingSpeedUnit = "cpm";
  }

  //@ts-expect-error
  if (configObj.showAverage === "wpm") {
    configObj.showAverage = "speed";
  }

  if (typeof configObj.playSoundOnError === "boolean") {
    configObj.playSoundOnError = configObj.playSoundOnError ? "1" : "off";
  }

  //@ts-expect-error
  if (configObj.showTimerProgress === false) {
    configObj.timerStyle = "off";
  }

  //@ts-expect-error
  if (configObj.showLiveWpm === true) {
    let val: ConfigSchemas.LiveSpeedAccBurstStyle = "mini";
    if (configObj.timerStyle !== "bar" && configObj.timerStyle !== "off") {
      val = configObj.timerStyle as ConfigSchemas.LiveSpeedAccBurstStyle;
    }
    configObj.liveSpeedStyle = val;
  }

  //@ts-expect-error
  if (configObj.showLiveBurst === true) {
    let val: ConfigSchemas.LiveSpeedAccBurstStyle = "mini";
    if (configObj.timerStyle !== "bar" && configObj.timerStyle !== "off") {
      val = configObj.timerStyle as ConfigSchemas.LiveSpeedAccBurstStyle;
    }
    configObj.liveBurstStyle = val;
  }

  //@ts-expect-error
  if (configObj.showLiveAcc === true) {
    let val: ConfigSchemas.LiveSpeedAccBurstStyle = "mini";
    if (configObj.timerStyle !== "bar" && configObj.timerStyle !== "off") {
      val = configObj.timerStyle as ConfigSchemas.LiveSpeedAccBurstStyle;
    }
    configObj.liveAccStyle = val;
  }

  if (typeof configObj.soundVolume === "string") {
    configObj.soundVolume = parseFloat(configObj.soundVolume);
  }

  return configObj;
}
