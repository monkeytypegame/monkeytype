import * as DB from "./db";
import * as Notifications from "./elements/notifications";
import { isConfigValueValid } from "./config-validation";
import * as ConfigEvent from "./observables/config-event";
import * as AccountButton from "./elements/account-button";
import { debounce } from "throttle-debounce";
import {
  canSetConfigWithCurrentFunboxes,
  canSetFunboxWithConfig,
} from "./test/funbox/funbox-validation";
import {
  createErrorMessage,
  isObject,
  promiseWithResolvers,
  triggerResize,
  typedKeys,
} from "./utils/misc";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { Config, FunboxName } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import { Language } from "@monkeytype/schemas/languages";
import { LocalStorageWithSchema } from "./utils/local-storage-with-schema";
import {
  mergeWithDefaultConfig,
  migrateConfig,
  replaceLegacyValues,
  sanitizeConfig,
} from "./utils/config";
import { getDefaultConfig } from "./constants/default-config";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { ZodSchema } from "zod";
import * as TestState from "./test/test-state";
import { ConfigMetadataObject, configMetadata } from "./config-metadata";
import { FontName } from "@monkeytype/schemas/fonts";

const configLS = new LocalStorageWithSchema({
  key: "config",
  schema: ConfigSchemas.ConfigSchema,
  fallback: getDefaultConfig(),
  migrate: (value, _issues) => {
    if (!isObject(value)) {
      return getDefaultConfig();
    }
    //todo maybe send a full config to db so that it removes legacy values

    return migrateConfig(value);
  },
});

let config: Config = {
  ...getDefaultConfig(),
};

let configToSend: Partial<Config> = {};
const saveToDatabase = debounce(1000, () => {
  if (Object.keys(configToSend).length > 0) {
    AccountButton.loading(true);
    void DB.saveConfig(configToSend).then(() => {
      AccountButton.loading(false);
    });
  }
  configToSend = {} as Config;
});

function saveToLocalStorage(
  key: keyof Config,
  nosave = false,
  noDbCheck = false
): void {
  if (nosave) return;
  configLS.set(config);
  if (!noDbCheck) {
    //@ts-expect-error this is fine
    configToSend[key] = config[key];
    saveToDatabase();
  }
  const localToSaveStringified = JSON.stringify(config);
  ConfigEvent.dispatch("saveToLocalStorage", localToSaveStringified);
}

export function saveFullConfigToLocalStorage(noDbCheck = false): void {
  console.log("saving full config to localStorage");
  configLS.set(config);
  if (!noDbCheck) {
    AccountButton.loading(true);
    void DB.saveConfig(config);
    AccountButton.loading(false);
  }
  const stringified = JSON.stringify(config);
  ConfigEvent.dispatch("saveToLocalStorage", stringified);
}

function isConfigChangeBlocked(): boolean {
  if (TestState.isActive && config.funbox.includes("no_quit")) {
    Notifications.add("No quit funbox is active. Please finish the test.", 0, {
      important: true,
    });
    return true;
  }
  return false;
}

export function genericSet<T extends keyof ConfigSchemas.Config>(
  key: T,
  value: ConfigSchemas.Config[T],
  nosave: boolean = false
): boolean {
  const metadata = configMetadata[key] as ConfigMetadataObject[T];
  if (metadata === undefined) {
    throw new Error(`Config metadata for key "${key}" is not defined.`);
  }

  if (metadata.overrideValue) {
    value = metadata.overrideValue({
      value,
      currentValue: config[key],
      currentConfig: config,
    });
  }

  const previousValue = config[key];

  if (
    metadata.changeRequiresRestart &&
    TestState.isActive &&
    config.funbox.includes("no_quit")
  ) {
    Notifications.add("No quit funbox is active. Please finish the test.", 0, {
      important: true,
    });
    console.warn(
      `Could not set config key "${key}" with value "${JSON.stringify(
        value
      )}" - no quit funbox active.`
    );
    return false;
  }

  if (metadata.isBlocked?.({ value, currentConfig: config })) {
    console.warn(
      `Could not set config key "${key}" with value "${JSON.stringify(
        value
      )}" - blocked.`
    );
    return false;
  }

  const schema = ConfigSchemas.ConfigSchema.shape[key] as ZodSchema;

  if (!isConfigValueValid(metadata.displayString ?? key, value, schema)) {
    console.warn(
      `Could not set config key "${key}" with value "${JSON.stringify(
        value
      )}" - invalid value.`
    );
    return false;
  }

  if (!canSetConfigWithCurrentFunboxes(key, value, config.funbox)) {
    console.warn(
      `Could not set config key "${key}" with value "${JSON.stringify(
        value
      )}" - funbox conflict.`
    );
    return false;
  }

  if (metadata.overrideConfig) {
    const targetConfig = metadata.overrideConfig({
      value,
      currentConfig: config,
    });

    for (const targetKey of typedKeys(targetConfig)) {
      const targetValue = targetConfig[
        targetKey
      ] as ConfigSchemas.Config[keyof typeof configMetadata];

      if (config[targetKey] === targetValue) {
        continue; // no need to set if the value is already the same
      }

      const set = genericSet(targetKey, targetValue, true);
      if (!set) {
        throw new Error(
          `Failed to set config key "${targetKey}" with value "${targetValue}" for ${metadata.displayString} config override.`
        );
      }
    }
  }

  config[key] = value;
  if (!nosave) saveToLocalStorage(key, nosave);
  ConfigEvent.dispatch(key, value, nosave, previousValue);

  if (metadata.triggerResize && !nosave) {
    triggerResize();
  }

  metadata.afterSet?.({ nosave: nosave || false, currentConfig: config });

  return true;
}

//numbers
export function setNumbers(numb: boolean, nosave?: boolean): boolean {
  return genericSet("numbers", numb, nosave);
}

//punctuation
export function setPunctuation(punc: boolean, nosave?: boolean): boolean {
  return genericSet("punctuation", punc, nosave);
}

export function setMode(mode: Mode, nosave?: boolean): boolean {
  return genericSet("mode", mode, nosave);
}

export function setPlaySoundOnError(
  val: ConfigSchemas.PlaySoundOnError,
  nosave?: boolean
): boolean {
  return genericSet("playSoundOnError", val, nosave);
}

export function setPlaySoundOnClick(
  val: ConfigSchemas.PlaySoundOnClick,
  nosave?: boolean
): boolean {
  return genericSet("playSoundOnClick", val, nosave);
}

export function setSoundVolume(
  val: ConfigSchemas.SoundVolume,
  nosave?: boolean
): boolean {
  return genericSet("soundVolume", val, nosave);
}

export function setPlayTimeWarning(
  value: ConfigSchemas.PlayTimeWarning,
  nosave?: boolean
): boolean {
  return genericSet("playTimeWarning", value, nosave);
}

//difficulty
export function setDifficulty(
  diff: ConfigSchemas.Difficulty,
  nosave?: boolean
): boolean {
  return genericSet("difficulty", diff, nosave);
}

//set fav themes
export function setFavThemes(
  themes: ConfigSchemas.FavThemes,
  nosave?: boolean
): boolean {
  return genericSet("favThemes", themes, nosave);
}

export function setFunbox(
  funbox: ConfigSchemas.Funbox,
  nosave?: boolean
): boolean {
  return genericSet("funbox", funbox, nosave);
}

export function toggleFunbox(funbox: FunboxName, nosave?: boolean): boolean {
  if (isConfigChangeBlocked()) return false;

  if (!canSetFunboxWithConfig(funbox, config)) {
    return false;
  }

  let newConfig: FunboxName[] = config.funbox;

  if (newConfig.includes(funbox)) {
    newConfig = newConfig.filter((it) => it !== funbox);
  } else {
    newConfig.push(funbox);
    newConfig.sort();
  }

  if (!isConfigValueValid("funbox", newConfig, ConfigSchemas.FunboxSchema)) {
    return false;
  }

  config.funbox = newConfig;
  saveToLocalStorage("funbox", nosave);
  ConfigEvent.dispatch("funbox", config.funbox);

  return true;
}

export function setBlindMode(blind: boolean, nosave?: boolean): boolean {
  return genericSet("blindMode", blind, nosave);
}

export function setAccountChart(
  array: ConfigSchemas.AccountChart,
  nosave?: boolean
): boolean {
  return genericSet("accountChart", array, nosave);
}

export function setStopOnError(
  soe: ConfigSchemas.StopOnError,
  nosave?: boolean
): boolean {
  return genericSet("stopOnError", soe, nosave);
}

export function setAlwaysShowDecimalPlaces(
  val: boolean,
  nosave?: boolean
): boolean {
  return genericSet("alwaysShowDecimalPlaces", val, nosave);
}

export function setTypingSpeedUnit(
  val: ConfigSchemas.TypingSpeedUnit,
  nosave?: boolean
): boolean {
  return genericSet("typingSpeedUnit", val, nosave);
}

export function setShowOutOfFocusWarning(
  val: boolean,
  nosave?: boolean
): boolean {
  return genericSet("showOutOfFocusWarning", val, nosave);
}

//pace caret
export function setPaceCaret(
  val: ConfigSchemas.PaceCaret,
  nosave?: boolean
): boolean {
  return genericSet("paceCaret", val, nosave);
}

export function setPaceCaretCustomSpeed(
  val: ConfigSchemas.PaceCaretCustomSpeed,
  nosave?: boolean
): boolean {
  return genericSet("paceCaretCustomSpeed", val, nosave);
}

export function setRepeatedPace(pace: boolean, nosave?: boolean): boolean {
  return genericSet("repeatedPace", pace, nosave);
}

//min wpm
export function setMinWpm(
  minwpm: ConfigSchemas.MinimumWordsPerMinute,
  nosave?: boolean
): boolean {
  return genericSet("minWpm", minwpm, nosave);
}

export function setMinWpmCustomSpeed(
  val: ConfigSchemas.MinWpmCustomSpeed,
  nosave?: boolean
): boolean {
  return genericSet("minWpmCustomSpeed", val, nosave);
}

//min acc
export function setMinAcc(
  min: ConfigSchemas.MinimumAccuracy,
  nosave?: boolean
): boolean {
  return genericSet("minAcc", min, nosave);
}

export function setMinAccCustom(
  val: ConfigSchemas.MinimumAccuracyCustom,
  nosave?: boolean
): boolean {
  return genericSet("minAccCustom", val, nosave);
}

//min burst
export function setMinBurst(
  min: ConfigSchemas.MinimumBurst,
  nosave?: boolean
): boolean {
  return genericSet("minBurst", min, nosave);
}

export function setMinBurstCustomSpeed(
  val: ConfigSchemas.MinimumBurstCustomSpeed,
  nosave?: boolean
): boolean {
  return genericSet("minBurstCustomSpeed", val, nosave);
}

//always show words history
export function setAlwaysShowWordsHistory(
  val: boolean,
  nosave?: boolean
): boolean {
  return genericSet("alwaysShowWordsHistory", val, nosave);
}

//single list command line
export function setSingleListCommandLine(
  option: ConfigSchemas.SingleListCommandLine,
  nosave?: boolean
): boolean {
  return genericSet("singleListCommandLine", option, nosave);
}

//caps lock warning
export function setCapsLockWarning(val: boolean, nosave?: boolean): boolean {
  return genericSet("capsLockWarning", val, nosave);
}

export function setShowAllLines(sal: boolean, nosave?: boolean): boolean {
  return genericSet("showAllLines", sal, nosave);
}

export function setQuickEnd(qe: boolean, nosave?: boolean): boolean {
  return genericSet("quickEnd", qe, nosave);
}

export function setAds(val: ConfigSchemas.Ads, nosave?: boolean): boolean {
  return genericSet("ads", val, nosave);
}

export function setRepeatQuotes(
  val: ConfigSchemas.RepeatQuotes,
  nosave?: boolean
): boolean {
  return genericSet("repeatQuotes", val, nosave);
}

//flip colors
export function setFlipTestColors(flip: boolean, nosave?: boolean): boolean {
  return genericSet("flipTestColors", flip, nosave);
}

//extra color
export function setColorfulMode(extra: boolean, nosave?: boolean): boolean {
  return genericSet("colorfulMode", extra, nosave);
}

//strict space
export function setStrictSpace(val: boolean, nosave?: boolean): boolean {
  return genericSet("strictSpace", val, nosave);
}

//opposite shift space
export function setOppositeShiftMode(
  val: ConfigSchemas.OppositeShiftMode,
  nosave?: boolean
): boolean {
  return genericSet("oppositeShiftMode", val, nosave);
}

export function setCaretStyle(
  caretStyle: ConfigSchemas.CaretStyle,
  nosave?: boolean
): boolean {
  return genericSet("caretStyle", caretStyle, nosave);
}

export function setPaceCaretStyle(
  caretStyle: ConfigSchemas.CaretStyle,
  nosave?: boolean
): boolean {
  return genericSet("paceCaretStyle", caretStyle, nosave);
}

export function setShowAverage(
  value: ConfigSchemas.ShowAverage,
  nosave?: boolean
): boolean {
  return genericSet("showAverage", value, nosave);
}

export function setHighlightMode(
  mode: ConfigSchemas.HighlightMode,
  nosave?: boolean
): boolean {
  return genericSet("highlightMode", mode, nosave);
}

export function setTapeMode(
  mode: ConfigSchemas.TapeMode,
  nosave?: boolean
): boolean {
  return genericSet("tapeMode", mode, nosave);
}

export function setTapeMargin(
  value: ConfigSchemas.TapeMargin,
  nosave?: boolean
): boolean {
  return genericSet("tapeMargin", value, nosave);
}

export function setHideExtraLetters(val: boolean, nosave?: boolean): boolean {
  return genericSet("hideExtraLetters", val, nosave);
}

export function setTimerStyle(
  style: ConfigSchemas.TimerStyle,
  nosave?: boolean
): boolean {
  return genericSet("timerStyle", style, nosave);
}

export function setLiveSpeedStyle(
  style: ConfigSchemas.LiveSpeedAccBurstStyle,
  nosave?: boolean
): boolean {
  return genericSet("liveSpeedStyle", style, nosave);
}

export function setLiveAccStyle(
  style: ConfigSchemas.LiveSpeedAccBurstStyle,
  nosave?: boolean
): boolean {
  return genericSet("liveAccStyle", style, nosave);
}

export function setLiveBurstStyle(
  style: ConfigSchemas.LiveSpeedAccBurstStyle,
  nosave?: boolean
): boolean {
  return genericSet("liveBurstStyle", style, nosave);
}

export function setTimerColor(
  color: ConfigSchemas.TimerColor,
  nosave?: boolean
): boolean {
  return genericSet("timerColor", color, nosave);
}
export function setTimerOpacity(
  opacity: ConfigSchemas.TimerOpacity,
  nosave?: boolean
): boolean {
  return genericSet("timerOpacity", opacity, nosave);
}

//key tips
export function setKeyTips(keyTips: boolean, nosave?: boolean): boolean {
  return genericSet("showKeyTips", keyTips, nosave);
}

//mode
export function setTimeConfig(
  time: ConfigSchemas.TimeConfig,
  nosave?: boolean
): boolean {
  return genericSet("time", time, nosave);
}

export function setQuoteLength(
  len: ConfigSchemas.QuoteLengthConfig,
  nosave?: boolean
): boolean {
  return genericSet("quoteLength", len, nosave);
}

export function setQuoteLengthAll(nosave?: boolean): boolean {
  return genericSet("quoteLength", [0, 1, 2, 3], nosave);
}

export function setWordCount(
  wordCount: ConfigSchemas.WordCount,
  nosave?: boolean
): boolean {
  return genericSet("words", wordCount, nosave);
}

//caret
export function setSmoothCaret(
  mode: ConfigSchemas.SmoothCaret,
  nosave?: boolean
): boolean {
  return genericSet("smoothCaret", mode, nosave);
}

export function setCodeUnindentOnBackspace(
  mode: boolean,
  nosave?: boolean
): boolean {
  return genericSet("codeUnindentOnBackspace", mode, nosave);
}

export function setStartGraphsAtZero(mode: boolean, nosave?: boolean): boolean {
  return genericSet("startGraphsAtZero", mode, nosave);
}

//linescroll
export function setSmoothLineScroll(mode: boolean, nosave?: boolean): boolean {
  return genericSet("smoothLineScroll", mode, nosave);
}

//quick restart
export function setQuickRestartMode(
  mode: ConfigSchemas.QuickRestart,
  nosave?: boolean
): boolean {
  return genericSet("quickRestart", mode, nosave);
}

//font family
export function setFontFamily(font: FontName, nosave?: boolean): boolean {
  return genericSet("fontFamily", font, nosave);
}

//freedom
export function setFreedomMode(freedom: boolean, nosave?: boolean): boolean {
  return genericSet("freedomMode", freedom, nosave);
}

export function setConfidenceMode(
  cm: ConfigSchemas.ConfidenceMode,
  nosave?: boolean
): boolean {
  return genericSet("confidenceMode", cm, nosave);
}

export function setIndicateTypos(
  value: ConfigSchemas.IndicateTypos,
  nosave?: boolean
): boolean {
  return genericSet("indicateTypos", value, nosave);
}

export function setAutoSwitchTheme(
  boolean: boolean,
  nosave?: boolean
): boolean {
  return genericSet("autoSwitchTheme", boolean, nosave);
}

export function setCustomTheme(boolean: boolean, nosave?: boolean): boolean {
  return genericSet("customTheme", boolean, nosave);
}

export function setTheme(
  name: ConfigSchemas.ThemeName,
  nosave?: boolean
): boolean {
  return genericSet("theme", name, nosave);
}

export function setThemeLight(
  name: ConfigSchemas.ThemeName,
  nosave?: boolean
): boolean {
  return genericSet("themeLight", name, nosave);
}

export function setThemeDark(
  name: ConfigSchemas.ThemeName,
  nosave?: boolean
): boolean {
  return genericSet("themeDark", name, nosave);
}

export function setRandomTheme(
  val: ConfigSchemas.RandomTheme,
  nosave?: boolean
): boolean {
  return genericSet("randomTheme", val, nosave);
}

export function setBritishEnglish(val: boolean, nosave?: boolean): boolean {
  return genericSet("britishEnglish", val, nosave);
}

export function setLazyMode(val: boolean, nosave?: boolean): boolean {
  return genericSet("lazyMode", val, nosave);
}

export function setCustomThemeColors(
  colors: ConfigSchemas.CustomThemeColors,
  nosave?: boolean
): boolean {
  return genericSet("customThemeColors", colors, nosave);
}

export function setLanguage(language: Language, nosave?: boolean): boolean {
  return genericSet("language", language, nosave);
}

export function setMonkey(monkey: boolean, nosave?: boolean): boolean {
  return genericSet("monkey", monkey, nosave);
}

export function setKeymapMode(
  mode: ConfigSchemas.KeymapMode,
  nosave?: boolean
): boolean {
  return genericSet("keymapMode", mode, nosave);
}

export function setKeymapLegendStyle(
  style: ConfigSchemas.KeymapLegendStyle,
  nosave?: boolean
): boolean {
  return genericSet("keymapLegendStyle", style, nosave);
}

export function setKeymapStyle(
  style: ConfigSchemas.KeymapStyle,
  nosave?: boolean
): boolean {
  return genericSet("keymapStyle", style, nosave);
}

export function setKeymapLayout(
  layout: ConfigSchemas.KeymapLayout,
  nosave?: boolean
): boolean {
  return genericSet("keymapLayout", layout, nosave);
}

export function setKeymapShowTopRow(
  show: ConfigSchemas.KeymapShowTopRow,
  nosave?: boolean
): boolean {
  return genericSet("keymapShowTopRow", show, nosave);
}

export function setKeymapSize(
  keymapSize: ConfigSchemas.KeymapSize,
  nosave?: boolean
): boolean {
  return genericSet("keymapSize", keymapSize, nosave);
}

export function setLayout(
  layout: ConfigSchemas.Layout,
  nosave?: boolean
): boolean {
  return genericSet("layout", layout, nosave);
}

export function setFontSize(
  fontSize: ConfigSchemas.FontSize,
  nosave?: boolean
): boolean {
  return genericSet("fontSize", fontSize, nosave);
}

export function setMaxLineWidth(
  maxLineWidth: ConfigSchemas.MaxLineWidth,
  nosave?: boolean
): boolean {
  return genericSet("maxLineWidth", maxLineWidth, nosave);
}

export function setCustomBackground(
  value: ConfigSchemas.CustomBackground,
  nosave?: boolean
): boolean {
  return genericSet("customBackground", value, nosave);
}

export function setCustomLayoutfluid(
  value: ConfigSchemas.CustomLayoutFluid,
  nosave?: boolean
): boolean {
  return genericSet("customLayoutfluid", value, nosave);
}

export function setCustomPolyglot(
  value: ConfigSchemas.CustomPolyglot,
  nosave?: boolean
): boolean {
  return genericSet("customPolyglot", value, nosave);
}

export function setCustomBackgroundSize(
  value: ConfigSchemas.CustomBackgroundSize,
  nosave?: boolean
): boolean {
  return genericSet("customBackgroundSize", value, nosave);
}

export function setCustomBackgroundFilter(
  array: ConfigSchemas.CustomBackgroundFilter,
  nosave?: boolean
): boolean {
  return genericSet("customBackgroundFilter", array, nosave);
}

export function setMonkeyPowerLevel(
  level: ConfigSchemas.MonkeyPowerLevel,
  nosave?: boolean
): boolean {
  return genericSet("monkeyPowerLevel", level, nosave);
}

export function setBurstHeatmap(value: boolean, nosave?: boolean): boolean {
  return genericSet("burstHeatmap", value, nosave);
}

const lastConfigsToApply: Set<keyof Config> = new Set([
  "keymapMode",
  "minWpm",
  "minAcc",
  "minBurst",
  "paceCaret",
  "quoteLength", //quote length sets mode,
  "words",
  "time",
  "mode", // mode sets punctuation and numbers
  "numbers",
  "punctuation",
  "funbox",
]);

export async function apply(partialConfig: Partial<Config>): Promise<void> {
  if (partialConfig === undefined || partialConfig === null) return;

  //migrate old values if needed, remove additional keys and merge with default config
  const fullConfig = mergeWithDefaultConfig(
    sanitizeConfig(replaceLegacyValues(partialConfig))
  );

  ConfigEvent.dispatch("fullConfigChange");

  const defaultConfig = getDefaultConfig();
  for (const key of typedKeys(fullConfig)) {
    //@ts-expect-error this is fine, both are of type config
    config[key] = defaultConfig[key];
  }

  const configKeysToReset: (keyof Config)[] = [];

  const configKeys = typedKeys(fullConfig);
  const firstKeys = configKeys.filter((key) => !lastConfigsToApply.has(key));
  const lastKeys = Array.from(lastConfigsToApply.values()).filter((key) =>
    configKeys.includes(key)
  );

  for (const configKey of [...firstKeys, ...lastKeys]) {
    const configValue = fullConfig[configKey];

    const set = genericSet(configKey, configValue, true);

    if (!set) {
      configKeysToReset.push(configKey);
    }
  }

  for (const key of configKeysToReset) {
    saveToLocalStorage(key);
  }

  ConfigEvent.dispatch(
    "configApplied",
    undefined,
    undefined,
    undefined,
    config
  );
  ConfigEvent.dispatch("fullConfigChangeFinished");
}

export async function reset(): Promise<void> {
  await apply(getDefaultConfig());
  await DB.resetConfig();
  saveFullConfigToLocalStorage(true);
}

export async function loadFromLocalStorage(): Promise<void> {
  console.log("loading localStorage config");
  const newConfig = configLS.get();
  if (newConfig === undefined) {
    await reset();
  } else {
    await apply(newConfig);
    saveFullConfigToLocalStorage(true);
  }
  loadDone();
}

export function getConfigChanges(): Partial<Config> {
  const configChanges: Partial<Config> = {};
  typedKeys(config)
    .filter((key) => {
      return config[key] !== getDefaultConfig()[key];
    })
    .forEach((key) => {
      //@ts-expect-error this is fine
      configChanges[key] = config[key];
    });
  return configChanges;
}

export async function applyFromJson(json: string): Promise<void> {
  try {
    const parsedConfig = parseJsonWithSchema(
      json,
      ConfigSchemas.PartialConfigSchema.strip(),
      {
        migrate: (value) => {
          if (Array.isArray(value)) {
            throw new Error("Invalid config");
          }
          return migrateConfig(value);
        },
      }
    );
    await apply(parsedConfig);
    saveFullConfigToLocalStorage();
    Notifications.add("Done", 1);
  } catch (e) {
    const msg = createErrorMessage(e, "Failed to import settings");
    console.error(msg);
    Notifications.add(msg, -1);
  }
}

const { promise: loadPromise, resolve: loadDone } = promiseWithResolvers();

export { loadPromise };
export default config;
export const __testing = {
  configMetadata,
  replaceConfig: (setConfig: Partial<Config>): void => {
    config = { ...getDefaultConfig(), ...setConfig };
    configToSend = {} as Config;
  },
  getConfig: () => config,
};
