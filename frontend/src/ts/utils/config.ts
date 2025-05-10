import {
  Config,
  ConfigValue,
  PartialConfig,
  FunboxName,
} from "@monkeytype/contracts/schemas/configs";
import { typedKeys } from "./misc";
import * as ConfigSchemas from "@monkeytype/contracts/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { ThemeNameSchema } from "@monkeytype/contracts/schemas/themes";
/**
 * migrates possible outdated config and merges with the default config values
 * @param config partial or possible outdated config
 * @returns
 */
export function migrateConfig(config: PartialConfig | object): Config {
  //todo this assumes config is matching all schemas
  //i think we should go through each value and validate
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

const sanitizeConfig = (
  obj: ConfigSchemas.PartialConfig
): ConfigSchemas.PartialConfig => {
  const result = ConfigSchemas.PartialConfigSchema.safeParse(obj);

  if (result.success) {
    return obj;
  }

  const errorKeys = new Set(
    result.error.errors.map((it) => it.path[0] as string)
  );

  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !errorKeys.has(key))
  );
};
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

  if (
    configObj.favThemes &&
    !ConfigSchemas.FavThemesSchema.safeParse(configObj.favThemes).success
  ) {
    configObj.favThemes = configObj.favThemes?.filter(
      (it) => ThemeNameSchema.safeParse(it).success
    );
  }

  return configObj;
}
