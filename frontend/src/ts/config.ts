import * as DB from "./db";
import * as Notifications from "./elements/notifications";
import { isConfigValueValid } from "./config-validation";
import * as ConfigEvent from "./observables/config-event";
import { isAuthenticated } from "./firebase";
import * as AccountButton from "./elements/account-button";
import { debounce } from "throttle-debounce";
import {
  canSetConfigWithCurrentFunboxes,
  canSetFunboxWithConfig,
} from "./test/funbox/funbox-validation";
import {
  createErrorMessage,
  isDevEnvironment,
  isObject,
  promiseWithResolvers,
  reloadAfter,
  typedKeys,
} from "./utils/misc";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { Config, FunboxName } from "@monkeytype/schemas/configs";
import { Mode, ModeSchema } from "@monkeytype/schemas/shared";
import { Language, LanguageSchema } from "@monkeytype/schemas/languages";
import { LocalStorageWithSchema } from "./utils/local-storage-with-schema";
import { migrateConfig } from "./utils/config";
import { roundTo1 } from "@monkeytype/util/numbers";
import { getDefaultConfig } from "./constants/default-config";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { ZodSchema } from "zod";
import * as TestState from "./test/test-state";

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

let config = {
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

// type ConfigMetadata = Partial<
//   Record<
//     ConfigSchemas.ConfigKey,
//     {
//       configKey: ConfigSchemas.ConfigKey;
//       schema: z.ZodTypeAny;
//       displayString?: string;
//       preventSet: (
//         value: ConfigSchemas.Config[keyof ConfigSchemas.Config]
//       ) => boolean;
//     }
//   >
// >;

function isConfigChangeBlocked(): boolean {
  if (TestState.isActive && config.funbox.includes("no_quit")) {
    Notifications.add("No quit funbox is active. Please finish the test.", 0, {
      important: true,
    });
    return true;
  }
  return false;
}

// type SetBlock = {
//   [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K][];
// };

// type RequiredConfig = {
//   [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K];
// };

export type ConfigMetadata = {
  [K in keyof ConfigSchemas.Config]: {
    /**
     * Optional display string for the config key.
     */
    displayString?: string;
    /**
     * Should the config change trigger a resize event? handled in ui.ts:108
     */
    triggerResize?: true;

    /**
     * Is a test restart required after this config change?
     */
    changeRequiresRestart: boolean;
    /**
     * Optional function that checks if the config value is blocked from being set.
     * Returns true if setting the config value should be blocked.
     * @param value - The value being set for the config key.
     */
    isBlocked?: (value: ConfigSchemas.Config[K]) => boolean;
    /**
     * Optional function to override the value before setting it.
     * Returns the modified value.
     * @param value - The value being set for the config key.
     * @param currentValue - The current value of the config key.
     */
    overrideValue?: (
      value: ConfigSchemas.Config[K],
      currentValue: ConfigSchemas.Config[K]
    ) => ConfigSchemas.Config[K];
    /**
     * Optional function to override other config values before this one is set.
     * Returns an object with the config keys and their new values.
     * @param value - The value being set for the config key.
     */
    overrideConfig?: (
      value: ConfigSchemas.Config[K]
    ) => Partial<ConfigSchemas.Config>;
    /**
     * Optional function that is called after the config value is set.
     * It can be used to perform additional actions, like reloading the page.
     * @param nosave - If true, the change is not saved to localStorage or database.
     */
    afterSet?: (nosave: boolean) => void;
  };
};

//todo:
// maybe have generic set somehow handle test restarting
// maybe add config group to each metadata object? all though its already defined in ConfigGroupsLiteral

const configMetadata: ConfigMetadata = {
  // test
  punctuation: {
    changeRequiresRestart: true,
    overrideValue: (value) => {
      if (config.mode === "quote") {
        return false;
      }
      return value;
    },
  },
  numbers: {
    changeRequiresRestart: true,
    overrideValue: (value) => {
      if (config.mode === "quote") {
        return false;
      }
      return value;
    },
  },
  words: {
    displayString: "word count",
    changeRequiresRestart: true,
  },
  time: {
    changeRequiresRestart: true,
    displayString: "time",
  },
  mode: {
    changeRequiresRestart: true,
    overrideConfig: (value) => {
      if (value === "custom" || value === "quote" || value === "zen") {
        return {
          numbers: false,
          punctuation: false,
        };
      }
      return {};
    },
    afterSet: () => {
      if (config.mode === "zen" && config.paceCaret !== "off") {
        Notifications.add(`Pace caret will not work with zen mode.`, 0);
      }
    },
  },
  quoteLength: {
    displayString: "quote length",
    changeRequiresRestart: true,
  },
  language: {
    displayString: "language",
    changeRequiresRestart: true,
  },
  burstHeatmap: {
    displayString: "burst heatmap",
    changeRequiresRestart: false,
  },

  // behavior
  difficulty: {
    changeRequiresRestart: true,
  },
  quickRestart: {
    displayString: "quick restart",
    changeRequiresRestart: false,
  },
  repeatQuotes: {
    displayString: "repeat quotes",
    changeRequiresRestart: false,
  },
  blindMode: {
    displayString: "blind mode",
    changeRequiresRestart: false,
  },
  alwaysShowWordsHistory: {
    displayString: "always show words history",
    changeRequiresRestart: false,
  },
  singleListCommandLine: {
    displayString: "single list command line",
    changeRequiresRestart: false,
  },
  minWpm: {
    displayString: "min speed",
    changeRequiresRestart: true,
  },
  minWpmCustomSpeed: {
    displayString: "min speed custom",
    changeRequiresRestart: true,
  },
  minAcc: {
    displayString: "min accuracy",
    changeRequiresRestart: true,
  },
  minAccCustom: {
    displayString: "min accuracy custom",
    changeRequiresRestart: true,
  },
  minBurst: {
    displayString: "min burst",
    changeRequiresRestart: true,
  },
  minBurstCustomSpeed: {
    displayString: "min burst custom speed",
    changeRequiresRestart: true,
  },
  britishEnglish: {
    displayString: "british english",
    changeRequiresRestart: true,
  },
  funbox: {
    changeRequiresRestart: true,
    isBlocked: (value) => {
      for (const funbox of config.funbox) {
        if (!canSetFunboxWithConfig(funbox, config)) {
          Notifications.add(
            `${value}" cannot be enabled with the current config`,
            0
          );
          return true;
        }
      }
      return false;
    },
  },
  customLayoutfluid: {
    displayString: "custom layoutfluid",
    changeRequiresRestart: true,
    overrideValue: (value) => {
      return Array.from(new Set(value));
    },
  },
  customPolyglot: {
    displayString: "custom polyglot",
    changeRequiresRestart: false,
    overrideValue: (value) => {
      return Array.from(new Set(value));
    },
  },

  // input
  freedomMode: {
    changeRequiresRestart: false,
    displayString: "freedom mode",
    overrideConfig: (value) => {
      if (value) {
        return {
          confidenceMode: "off",
        };
      }
      return {};
    },
  },
  strictSpace: {
    displayString: "strict space",
    changeRequiresRestart: true,
  },
  oppositeShiftMode: {
    displayString: "opposite shift mode",
    changeRequiresRestart: false,
  },
  stopOnError: {
    displayString: "stop on error",
    changeRequiresRestart: true,
    overrideConfig: (value) => {
      if (value !== "off") {
        return {
          confidenceMode: "off",
        };
      }
      return {};
    },
  },
  confidenceMode: {
    displayString: "confidence mode",
    changeRequiresRestart: false,
    overrideConfig: (value) => {
      if (value !== "off") {
        return {
          freedomMode: false,
          stopOnError: "off",
        };
      }
      return {};
    },
  },
  quickEnd: {
    displayString: "quick end",
    changeRequiresRestart: false,
  },
  indicateTypos: {
    displayString: "indicate typos",
    changeRequiresRestart: false,
  },
  hideExtraLetters: {
    displayString: "hide extra letters",
    changeRequiresRestart: false,
  },
  lazyMode: {
    displayString: "lazy mode",
    changeRequiresRestart: true,
  },
  layout: {
    displayString: "layout",
    changeRequiresRestart: true,
  },
  codeUnindentOnBackspace: {
    displayString: "code unindent on backspace",
    changeRequiresRestart: true,
  },

  // sound
  soundVolume: {
    displayString: "sound volume",
    changeRequiresRestart: false,
  },
  playSoundOnClick: {
    displayString: "play sound on click",
    changeRequiresRestart: false,
  },
  playSoundOnError: {
    displayString: "play sound on error",
    changeRequiresRestart: false,
  },

  // caret
  smoothCaret: {
    displayString: "smooth caret",
    changeRequiresRestart: false,
  },
  caretStyle: {
    displayString: "caret style",
    changeRequiresRestart: false,
  },
  paceCaret: {
    displayString: "pace caret",
    changeRequiresRestart: false,
    isBlocked: (value) => {
      if (document.readyState === "complete") {
        if ((value === "pb" || value === "tagPb") && !isAuthenticated()) {
          Notifications.add(
            `Pace caret "pb" and "tag pb" are unavailable without an account`,
            0
          );
          return true;
        }
      }
      return false;
    },
  },
  paceCaretCustomSpeed: {
    displayString: "pace caret custom speed",
    changeRequiresRestart: false,
  },
  paceCaretStyle: {
    displayString: "pace caret style",
    changeRequiresRestart: false,
  },
  repeatedPace: {
    displayString: "repeated pace",
    changeRequiresRestart: false,
  },

  // appearance
  timerStyle: {
    displayString: "timer style",
    changeRequiresRestart: false,
  },
  liveSpeedStyle: {
    displayString: "live speed style",
    changeRequiresRestart: false,
  },
  liveAccStyle: {
    displayString: "live accuracy style",
    changeRequiresRestart: false,
  },
  liveBurstStyle: {
    displayString: "live burst style",
    changeRequiresRestart: false,
  },
  timerColor: {
    displayString: "timer color",
    changeRequiresRestart: false,
  },
  timerOpacity: {
    displayString: "timer opacity",
    changeRequiresRestart: false,
  },
  highlightMode: {
    displayString: "highlight mode",
    changeRequiresRestart: false,
  },
  tapeMode: {
    triggerResize: true,
    changeRequiresRestart: false,
    displayString: "tape mode",
    overrideConfig: (value) => {
      if (value !== "off") {
        return {
          showAllLines: false,
        };
      }
      return {};
    },
  },
  tapeMargin: {
    displayString: "tape margin",
    changeRequiresRestart: false,
    overrideValue: (value) => {
      //TODO move to migration after settings validation
      if (value < 10) {
        value = 10;
      }
      if (value > 90) {
        value = 90;
      }
      return value;
    },
  },
  smoothLineScroll: {
    displayString: "smooth line scroll",
    changeRequiresRestart: false,
  },
  showAllLines: {
    changeRequiresRestart: false,
    displayString: "show all lines",
    isBlocked: (value) => {
      if (value && config.tapeMode !== "off") {
        Notifications.add("Show all lines doesn't support tape mode.", 0);
        return true;
      }
      return false;
    },
  },
  alwaysShowDecimalPlaces: {
    displayString: "always show decimal places",
    changeRequiresRestart: false,
  },
  typingSpeedUnit: {
    displayString: "typing speed unit",
    changeRequiresRestart: false,
  },
  startGraphsAtZero: {
    displayString: "start graphs at zero",
    changeRequiresRestart: false,
  },
  maxLineWidth: {
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "max line width",
    overrideValue: (value) => {
      //TODO move to migration after settings validation
      if (value < 20 && value !== 0) {
        value = 20;
      }
      if (value > 1000) {
        value = 1000;
      }
      return value;
    },
  },
  fontSize: {
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "font size",
    overrideValue: (value) => {
      //TODO move to migration after settings validation
      if (value < 0) {
        value = 1;
      }
      return value;
    },
  },
  fontFamily: {
    displayString: "font family",
    changeRequiresRestart: false,
  },
  keymapMode: {
    displayString: "keymap mode",
    changeRequiresRestart: false,
  },
  keymapLayout: {
    displayString: "keymap layout",
    changeRequiresRestart: false,
  },
  keymapStyle: {
    displayString: "keymap style",
    changeRequiresRestart: false,
  },
  keymapLegendStyle: {
    displayString: "keymap legend style",
    changeRequiresRestart: false,
  },
  keymapShowTopRow: {
    displayString: "keymap show top row",
    changeRequiresRestart: false,
  },
  keymapSize: {
    triggerResize: true,
    changeRequiresRestart: false,
    displayString: "keymap size",
    overrideValue: (value) => {
      if (value < 0.5) value = 0.5;
      if (value > 3.5) value = 3.5;
      return roundTo1(value);
    },
  },

  // theme
  flipTestColors: {
    displayString: "flip test colors",
    changeRequiresRestart: false,
  },
  colorfulMode: {
    displayString: "colorful mode",
    changeRequiresRestart: false,
  },
  customBackground: {
    displayString: "custom background",
    changeRequiresRestart: false,
    overrideValue: (value) => {
      return value.trim();
    },
  },
  customBackgroundSize: {
    displayString: "custom background size",
    changeRequiresRestart: false,
  },
  customBackgroundFilter: {
    displayString: "custom background filter",
    changeRequiresRestart: false,
  },
  autoSwitchTheme: {
    displayString: "auto switch theme",
    changeRequiresRestart: false,
  },
  themeLight: {
    displayString: "theme light",
    changeRequiresRestart: false,
  },
  themeDark: {
    displayString: "theme dark",
    changeRequiresRestart: false,
  },
  randomTheme: {
    changeRequiresRestart: false,
    displayString: "random theme",
    isBlocked: (value) => {
      if (value === "custom") {
        const snapshot = DB.getSnapshot();
        if (!isAuthenticated()) {
          Notifications.add(
            "Random theme 'custom' is unavailable without an account",
            0
          );
          return true;
        }
        if (!snapshot) {
          Notifications.add(
            "Random theme 'custom' requires a snapshot to be set",
            0
          );
          return true;
        }
        if (snapshot?.customThemes?.length === 0) {
          Notifications.add(
            "Random theme 'custom' requires at least one custom theme to be saved",
            0
          );
          return true;
        }
      }
      return false;
    },
  },
  favThemes: {
    displayString: "favorite themes",
    changeRequiresRestart: false,
  },
  theme: {
    changeRequiresRestart: false,
    overrideConfig: () => {
      return {
        customTheme: false,
      };
    },
  },
  customTheme: {
    displayString: "custom theme",
    changeRequiresRestart: false,
  },
  customThemeColors: {
    displayString: "custom theme colors",
    changeRequiresRestart: false,
  },

  // hide elements
  showKeyTips: {
    displayString: "show key tips",
    changeRequiresRestart: false,
  },
  showOutOfFocusWarning: {
    displayString: "show out of focus warning",
    changeRequiresRestart: false,
  },
  capsLockWarning: {
    displayString: "caps lock warning",
    changeRequiresRestart: false,
  },
  showAverage: {
    displayString: "show average",
    changeRequiresRestart: false,
  },

  // other (hidden)
  accountChart: {
    displayString: "account chart",
    changeRequiresRestart: false,
    overrideValue: (value, currentValue) => {
      // if both speed and accuracy are off, set opposite to on
      // i dedicate this fix to AshesOfAFallen and our 2 collective brain cells
      if (value[0] === "off" && value[1] === "off") {
        const changedIndex = value[0] === currentValue[0] ? 0 : 1;
        value[changedIndex] = "on";
      }
      return value;
    },
  },
  monkey: {
    displayString: "monkey",
    changeRequiresRestart: false,
  },
  monkeyPowerLevel: {
    displayString: "monkey power level",
    changeRequiresRestart: false,
  },

  // ads
  ads: {
    changeRequiresRestart: false,
    isBlocked: (value) => {
      if (value !== "off" && isDevEnvironment()) {
        Notifications.add("Ads are disabled in development mode.", 0);
        return true;
      }
      return false;
    },
    afterSet: (nosave) => {
      if (!nosave && !isDevEnvironment()) {
        reloadAfter(3);
        Notifications.add("Ad settings changed. Refreshing...", 0);
      }
    },
  },
};

export function genericSet<T extends keyof ConfigSchemas.Config>(
  key: T,
  value: ConfigSchemas.Config[T],
  nosave: boolean = false
): boolean {
  const metadata = configMetadata[key] as ConfigMetadata[T];
  if (metadata === undefined) {
    throw new Error(`Config metadata for key "${key}" is not defined.`);
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
    return false;
  }

  // if (metadata.setBlock) {
  //   let block = false;
  //   for (const blockKey of typedKeys(metadata.setBlock)) {
  //     const blockValues = metadata.setBlock[blockKey] ?? [];
  //     if (
  //       config[blockKey] !== undefined &&
  //       (blockValues as Array<(typeof config)[typeof blockKey]>).includes(
  //         config[blockKey]
  //       )
  //     ) {
  //       block = true;
  //       break;
  //     }
  //   }
  //   if (block) {
  //     return false;
  //   }
  // }

  if (metadata.isBlocked?.(value)) {
    return false;
  }

  if (metadata.overrideValue) {
    value = metadata.overrideValue(value, config[key]);
  }

  const schema = ConfigSchemas.ConfigSchema.shape[key] as ZodSchema;

  if (!isConfigValueValid(metadata.displayString ?? key, value, schema)) {
    return false;
  }

  if (!canSetConfigWithCurrentFunboxes(key, value, config.funbox)) {
    return false;
  }

  if (metadata.overrideConfig) {
    const targetConfig = metadata.overrideConfig(value);

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
    $(window).trigger("resize");
  }

  metadata.afterSet?.(nosave || false);

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
export function setFontFamily(
  font: ConfigSchemas.FontFamily,
  nosave?: boolean
): boolean {
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

export async function apply(
  configToApply: Config | Partial<Config>
): Promise<void> {
  if (configToApply === undefined) return;

  ConfigEvent.dispatch("fullConfigChange");

  const configObj = configToApply as Config;
  (Object.keys(getDefaultConfig()) as (keyof Config)[]).forEach((configKey) => {
    if (configObj[configKey] === undefined) {
      const newValue = getDefaultConfig()[configKey];
      (configObj[configKey] as typeof newValue) = newValue;
    }
  });
  if (configObj !== undefined && configObj !== null) {
    for (const configKey of typedKeys(configObj)) {
      const configValue = configObj[configKey];
      genericSet(configKey, configValue, true);
    }

    ConfigEvent.dispatch(
      "configApplied",
      undefined,
      undefined,
      undefined,
      config
    );
  }
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
