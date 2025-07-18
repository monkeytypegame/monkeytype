import * as DB from "./db";
import * as Notifications from "./elements/notifications";
import {
  isConfigValueValidBoolean,
  isConfigValueValid,
} from "./config-validation";
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
import * as ConfigSchemas from "@monkeytype/contracts/schemas/configs";
import { Config, FunboxName } from "@monkeytype/contracts/schemas/configs";
import { Mode, ModeSchema } from "@monkeytype/contracts/schemas/shared";
import {
  Language,
  LanguageSchema,
} from "@monkeytype/contracts/schemas/languages";
import { LocalStorageWithSchema } from "./utils/local-storage-with-schema";
import { migrateConfig } from "./utils/config";
import { roundTo1 } from "@monkeytype/util/numbers";
import { getDefaultConfig } from "./constants/default-config";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { z, ZodSchema } from "zod";
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

const config = {
  ...getDefaultConfig(),
};

let configToSend = {} as Config;
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

type ConfigMetadataProperty = "blockedByNoQuit";

type SetBlock = {
  [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K][];
};

//todo: remove the ? here so that all config elements must be defined
type ConfigMetadata = {
  [K in keyof ConfigSchemas.Config]?: {
    schema: ZodSchema;
    displayString?: string;
    properties?: ConfigMetadataProperty[];
    setBlock?: SetBlock;
    customSetBlock?: (value: ConfigSchemas.Config[K]) => boolean;
    valueOverride?: (value: ConfigSchemas.Config[K]) => ConfigSchemas.Config[K];
  };
};

//todo:
// maybe change blockedByNoQuit to 'canChangeDuringTest' which means that changing needs to restart test and noquit blocks that
// maybe have generic set somehow handle test restarting
// maybe add config group to each metadata object? all though its already defined in ConfigGroupsLiteral
// maybe rework valueoverride to dependsOn, for cases like stop on error and confidence mode or numbers and quote mode

const configMetadata = {
  numbers: {
    schema: z.boolean(),
    properties: ["blockedByNoQuit"],
    // setBlock: {
    //   mode: ["quote"],
    // },
    // customSetBlock: () => {
    //   if (config.mode === "quote") return true;
    //   return false;
    // },
    valueOverride: (value) => {
      if (config.mode === "quote") {
        return false;
      }
      return value;
    },
  },
  punctuation: {
    schema: z.boolean(),
    properties: ["blockedByNoQuit"],
    valueOverride: (value) => {
      if (config.mode === "quote") {
        return false;
      }
      return value;
    },
  },
  playSoundOnError: {
    schema: ConfigSchemas.PlaySoundOnErrorSchema,
    displayString: "play sound on error",
  },
  playSoundOnClick: {
    schema: ConfigSchemas.PlaySoundOnClickSchema,
    displayString: "play sound on click",
  },
  soundVolume: {
    schema: ConfigSchemas.SoundVolumeSchema,
    displayString: "sound volume",
  },
  difficulty: {
    schema: ConfigSchemas.DifficultySchema,
    properties: ["blockedByNoQuit"],
  },
  favThemes: {
    schema: ConfigSchemas.FavThemesSchema,
    displayString: "favorite themes",
  },
  blindMode: {
    schema: z.boolean(),
    displayString: "blind mode",
  },
  accountChart: {
    schema: ConfigSchemas.AccountChartSchema,
    displayString: "account chart",
    valueOverride: (value) => {
      // if both speed and accuracy are off, set speed to on
      // i dedicate this fix to AshesOfAFallen and our 2 collective brain cells
      if (value[0] === "off" && value[1] === "off") {
        value[0] = "on";
      }
      return value;
    },
  },
  alwaysShowDecimalPlaces: {
    schema: z.boolean(),
    displayString: "always show decimal places",
  },
  typingSpeedUnit: {
    schema: ConfigSchemas.TypingSpeedUnitSchema,
    displayString: "typing speed unit",
  },
  showOutOfFocusWarning: {
    schema: z.boolean(),
    displayString: "show out of focus warning",
  },
  paceCaretCustomSpeed: {
    schema: ConfigSchemas.PaceCaretCustomSpeedSchema,
    displayString: "pace caret custom speed",
  },
  repeatedPace: {
    schema: z.boolean(),
    displayString: "repeated pace",
  },
  minWpm: {
    schema: ConfigSchemas.MinimumWordsPerMinuteSchema,
    displayString: "min speed",
    properties: ["blockedByNoQuit"],
  },
  minWpmCustomSpeed: {
    schema: ConfigSchemas.MinWpmCustomSpeedSchema,
    displayString: "min speed custom",
    properties: ["blockedByNoQuit"],
  },
  minAcc: {
    schema: ConfigSchemas.MinimumAccuracySchema,
    displayString: "min accuracy",
    properties: ["blockedByNoQuit"],
  },
  minAccCustom: {
    schema: ConfigSchemas.MinimumAccuracyCustomSchema,
    displayString: "min accuracy custom",
    properties: ["blockedByNoQuit"],
  },
  minBurst: {
    schema: ConfigSchemas.MinimumBurstSchema,
    displayString: "min burst",
    properties: ["blockedByNoQuit"],
  },
  minBurstCustomSpeed: {
    schema: ConfigSchemas.MinimumBurstCustomSpeedSchema,
    displayString: "min burst custom speed",
    properties: ["blockedByNoQuit"],
  },
  alwaysShowWordsHistory: {
    schema: z.boolean(),
    displayString: "always show words history",
  },
  singleListCommandLine: {
    schema: ConfigSchemas.SingleListCommandLineSchema,
    displayString: "single list command line",
  },
  capsLockWarning: {
    schema: z.boolean(),
    displayString: "caps lock warning",
  },
  quickEnd: {
    schema: z.boolean(),
    displayString: "quick end",
  },
  repeatQuotes: {
    schema: ConfigSchemas.RepeatQuotesSchema,
    displayString: "repeat quotes",
  },
  flipTestColors: {
    schema: z.boolean(),
    displayString: "flip test colors",
  },
  colorfulMode: {
    schema: z.boolean(),
    displayString: "colorful mode",
  },
  strictSpace: {
    schema: z.boolean(),
    displayString: "strict space",
    properties: ["blockedByNoQuit"],
  },
  oppositeShiftMode: {
    schema: ConfigSchemas.OppositeShiftModeSchema,
    displayString: "opposite shift mode",
  },
  caretStyle: {
    schema: ConfigSchemas.CaretStyleSchema,
    displayString: "caret style",
  },
} satisfies ConfigMetadata;

export function genericSet<T extends keyof typeof configMetadata>(
  key: T,
  value: ConfigSchemas.Config[T],
  nosave?: boolean
): boolean {
  const metadata = configMetadata[key] as ConfigMetadata[T];
  if (metadata === undefined) {
    throw new Error(`Config metadata for key "${key}" is not defined.`);
  }

  const previousValue = config[key];

  if (
    metadata.properties?.includes("blockedByNoQuit") &&
    TestState.isActive &&
    config.funbox.includes("no_quit")
  ) {
    Notifications.add("No quit funbox is active. Please finish the test.", 0, {
      important: true,
    });
    return false;
  }

  if (metadata.setBlock) {
    let block = false;
    for (const blockKey of typedKeys(metadata.setBlock)) {
      const blockValues = metadata.setBlock[blockKey] ?? [];
      if (
        config[blockKey] !== undefined &&
        (blockValues as Array<(typeof config)[typeof blockKey]>).includes(
          config[blockKey]
        )
      ) {
        block = true;
        break;
      }
    }
    if (block) {
      return false;
    }
  }

  if (metadata.customSetBlock && metadata.customSetBlock(value)) {
    return false;
  }

  if (metadata.valueOverride) {
    value = metadata.valueOverride(value);
  }

  if (
    !isConfigValueValid(metadata.displayString ?? key, value, metadata.schema)
  ) {
    return false;
  }

  if (!canSetConfigWithCurrentFunboxes(key, value, config.funbox)) {
    return false;
  }

  config[key] = value;
  saveToLocalStorage(key, nosave);
  ConfigEvent.dispatch(key, value, nosave, previousValue);
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
  if (isConfigChangeBlocked()) return false;

  if (!isConfigValueValid("mode", mode, ModeSchema)) {
    return false;
  }

  if (!canSetConfigWithCurrentFunboxes("mode", mode, config.funbox)) {
    return false;
  }

  const previous = config.mode;
  config.mode = mode;
  if (config.mode === "custom") {
    setPunctuation(false, true);
    setNumbers(false, true);
  } else if (config.mode === "quote") {
    setPunctuation(false, true);
    setNumbers(false, true);
  } else if (config.mode === "zen") {
    if (config.paceCaret !== "off") {
      Notifications.add(`Pace caret will not work with zen mode.`, 0);
    }
  }
  saveToLocalStorage("mode", nosave);
  ConfigEvent.dispatch("mode", config.mode, nosave, previous);

  return true;
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
  if (isConfigChangeBlocked()) return false;

  if (!isConfigValueValid("funbox", funbox, ConfigSchemas.FunboxSchema))
    return false;

  for (const funbox of config.funbox) {
    if (!canSetFunboxWithConfig(funbox, config)) {
      return false;
    }
  }

  config.funbox = funbox;
  saveToLocalStorage("funbox", nosave);
  ConfigEvent.dispatch("funbox", config.funbox);

  return true;
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
  if (isConfigChangeBlocked()) return false;

  if (
    !isConfigValueValid("stop on error", soe, ConfigSchemas.StopOnErrorSchema)
  ) {
    return false;
  }

  config.stopOnError = soe;
  if (config.stopOnError !== "off") {
    config.confidenceMode = "off";
    saveToLocalStorage("confidenceMode", nosave);
  }
  saveToLocalStorage("stopOnError", nosave);
  ConfigEvent.dispatch("stopOnError", config.stopOnError, nosave);

  return true;
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
  if (!isConfigValueValid("pace caret", val, ConfigSchemas.PaceCaretSchema)) {
    return false;
  }

  if (document.readyState === "complete") {
    if ((val === "pb" || val === "tagPb") && !isAuthenticated()) {
      Notifications.add(
        `Pace caret "pb" and "tag pb" are unavailable without an account`,
        0
      );
      return false;
    }
  }
  // if (config.mode === "zen" && val !== "off") {
  //   Notifications.add(`Can't use pace caret with zen mode.`, 0);
  //   val = "off";
  // }
  config.paceCaret = val;
  saveToLocalStorage("paceCaret", nosave);
  ConfigEvent.dispatch("paceCaret", config.paceCaret, nosave);

  return true;
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
  if (!isConfigValueValidBoolean("show all lines", sal)) return false;

  if (sal && config.tapeMode !== "off") {
    Notifications.add("Show all lines doesn't support tape mode", 0);
    return false;
  }

  config.showAllLines = sal;
  saveToLocalStorage("showAllLines", nosave);
  ConfigEvent.dispatch("showAllLines", config.showAllLines, nosave);

  return true;
}

export function setQuickEnd(qe: boolean, nosave?: boolean): boolean {
  return genericSet("quickEnd", qe, nosave);
}

export function setAds(val: ConfigSchemas.Ads, nosave?: boolean): boolean {
  if (!isConfigValueValid("ads", val, ConfigSchemas.AdsSchema)) {
    return false;
  }

  if (isDevEnvironment()) {
    val = "off";
    console.debug("Ads are disabled in dev environment");
  }

  config.ads = val;
  saveToLocalStorage("ads", nosave);
  if (!nosave && !isDevEnvironment()) {
    reloadAfter(3);
    Notifications.add("Ad settings changed. Refreshing...", 0);
  }
  ConfigEvent.dispatch("ads", config.ads);

  return true;
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
  if (
    !isConfigValueValid(
      "pace caret style",
      caretStyle,
      ConfigSchemas.CaretStyleSchema
    )
  ) {
    return false;
  }

  config.paceCaretStyle = caretStyle;
  $("#paceCaret").removeClass("off");
  $("#paceCaret").removeClass("default");
  $("#paceCaret").removeClass("underline");
  $("#paceCaret").removeClass("outline");
  $("#paceCaret").removeClass("block");
  $("#paceCaret").removeClass("carrot");
  $("#paceCaret").removeClass("banana");

  if (caretStyle === "default") {
    $("#paceCaret").addClass("default");
  } else if (caretStyle === "block") {
    $("#paceCaret").addClass("block");
  } else if (caretStyle === "outline") {
    $("#paceCaret").addClass("outline");
  } else if (caretStyle === "underline") {
    $("#paceCaret").addClass("underline");
  } else if (caretStyle === "carrot") {
    $("#paceCaret").addClass("carrot");
  } else if (caretStyle === "banana") {
    $("#paceCaret").addClass("banana");
  }
  saveToLocalStorage("paceCaretStyle", nosave);
  ConfigEvent.dispatch("paceCaretStyle", config.paceCaretStyle);

  return true;
}

export function setShowAverage(
  value: ConfigSchemas.ShowAverage,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("show average", value, ConfigSchemas.ShowAverageSchema)
  ) {
    return false;
  }

  config.showAverage = value;
  saveToLocalStorage("showAverage", nosave);
  ConfigEvent.dispatch("showAverage", config.showAverage, nosave);

  return true;
}

export function setHighlightMode(
  mode: ConfigSchemas.HighlightMode,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "highlight mode",
      mode,
      ConfigSchemas.HighlightModeSchema
    )
  ) {
    return false;
  }

  if (!canSetConfigWithCurrentFunboxes("highlightMode", mode, config.funbox)) {
    return false;
  }

  config.highlightMode = mode;
  saveToLocalStorage("highlightMode", nosave);
  ConfigEvent.dispatch("highlightMode", config.highlightMode);

  return true;
}

export function setTapeMode(
  mode: ConfigSchemas.TapeMode,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("tape mode", mode, ConfigSchemas.TapeModeSchema)) {
    return false;
  }

  if (mode !== "off" && config.showAllLines) {
    setShowAllLines(false, true);
  }

  config.tapeMode = mode;
  saveToLocalStorage("tapeMode", nosave);
  ConfigEvent.dispatch("tapeMode", config.tapeMode);

  return true;
}

export function setTapeMargin(
  value: ConfigSchemas.TapeMargin,
  nosave?: boolean
): boolean {
  if (value < 10) {
    value = 10;
  }
  if (value > 90) {
    value = 90;
  }

  if (
    !isConfigValueValid("tape margin", value, ConfigSchemas.TapeMarginSchema)
  ) {
    return false;
  }

  config.tapeMargin = value;

  saveToLocalStorage("tapeMargin", nosave);
  ConfigEvent.dispatch("tapeMargin", config.tapeMargin, nosave);

  // trigger a resize event to update the layout - handled in ui.ts:108
  $(window).trigger("resize");

  return true;
}

export function setHideExtraLetters(val: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValidBoolean("hide extra letters", val)) return false;

  config.hideExtraLetters = val;
  saveToLocalStorage("hideExtraLetters", nosave);
  ConfigEvent.dispatch("hideExtraLetters", config.hideExtraLetters);

  return true;
}

export function setTimerStyle(
  style: ConfigSchemas.TimerStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("timer style", style, ConfigSchemas.TimerStyleSchema)
  ) {
    return false;
  }

  config.timerStyle = style;
  saveToLocalStorage("timerStyle", nosave);
  ConfigEvent.dispatch("timerStyle", config.timerStyle);

  return true;
}

export function setLiveSpeedStyle(
  style: ConfigSchemas.LiveSpeedAccBurstStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "live speed style",
      style,
      ConfigSchemas.LiveSpeedAccBurstStyleSchema
    )
  ) {
    return false;
  }

  config.liveSpeedStyle = style;
  saveToLocalStorage("liveSpeedStyle", nosave);
  ConfigEvent.dispatch("liveSpeedStyle", config.timerStyle);

  return true;
}

export function setLiveAccStyle(
  style: ConfigSchemas.LiveSpeedAccBurstStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "live acc style",
      style,
      ConfigSchemas.LiveSpeedAccBurstStyleSchema
    )
  ) {
    return false;
  }

  config.liveAccStyle = style;
  saveToLocalStorage("liveAccStyle", nosave);
  ConfigEvent.dispatch("liveAccStyle", config.timerStyle);

  return true;
}

export function setLiveBurstStyle(
  style: ConfigSchemas.LiveSpeedAccBurstStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "live burst style",
      style,
      ConfigSchemas.LiveSpeedAccBurstStyleSchema
    )
  ) {
    return false;
  }

  config.liveBurstStyle = style;
  saveToLocalStorage("liveBurstStyle", nosave);
  ConfigEvent.dispatch("liveBurstStyle", config.timerStyle);

  return true;
}

export function setTimerColor(
  color: ConfigSchemas.TimerColor,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("timer color", color, ConfigSchemas.TimerColorSchema)
  ) {
    return false;
  }

  config.timerColor = color;

  saveToLocalStorage("timerColor", nosave);
  ConfigEvent.dispatch("timerColor", config.timerColor);

  return true;
}
export function setTimerOpacity(
  opacity: ConfigSchemas.TimerOpacity,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "timer opacity",
      opacity,
      ConfigSchemas.TimerOpacitySchema
    )
  ) {
    return false;
  }

  config.timerOpacity = opacity;
  saveToLocalStorage("timerOpacity", nosave);
  ConfigEvent.dispatch("timerOpacity", config.timerOpacity);

  return true;
}

//key tips
export function setKeyTips(keyTips: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValidBoolean("key tips", keyTips)) return false;

  config.showKeyTips = keyTips;
  if (config.showKeyTips) {
    $("footer .keyTips").removeClass("hidden");
  } else {
    $("footer .keyTips").addClass("hidden");
  }
  saveToLocalStorage("showKeyTips", nosave);
  ConfigEvent.dispatch("showKeyTips", config.showKeyTips);

  return true;
}

//mode
export function setTimeConfig(
  time: ConfigSchemas.TimeConfig,
  nosave?: boolean
): boolean {
  if (isConfigChangeBlocked()) return false;

  time = isNaN(time) || time < 0 ? getDefaultConfig().time : time;
  if (!isConfigValueValid("time", time, ConfigSchemas.TimeConfigSchema))
    return false;

  if (!canSetConfigWithCurrentFunboxes("words", time, config.funbox)) {
    return false;
  }

  config.time = time;
  saveToLocalStorage("time", nosave);
  ConfigEvent.dispatch("time", config.time);

  return true;
}

export function setQuoteLength(
  len: ConfigSchemas.QuoteLength[] | ConfigSchemas.QuoteLength,
  nosave?: boolean,
  multipleMode?: boolean
): boolean {
  if (isConfigChangeBlocked()) return false;

  if (Array.isArray(len)) {
    if (
      !isConfigValueValid(
        "quote length",
        len,
        ConfigSchemas.QuoteLengthConfigSchema
      )
    ) {
      return false;
    }

    //config load
    if (len.length === 1 && len[0] === -1) len = [1];
    config.quoteLength = len;
  } else {
    if (
      !isConfigValueValid("quote length", len, ConfigSchemas.QuoteLengthSchema)
    ) {
      return false;
    }

    if (!Array.isArray(config.quoteLength)) config.quoteLength = [];
    if (len === null || isNaN(len) || len < -3 || len > 3) {
      len = 1;
    }
    len = parseInt(len.toString()) as ConfigSchemas.QuoteLength;

    if (len === -1) {
      config.quoteLength = [0, 1, 2, 3];
    } else if (multipleMode && len >= 0) {
      if (!config.quoteLength.includes(len)) {
        config.quoteLength.push(len);
      } else {
        if (config.quoteLength.length > 1) {
          config.quoteLength = config.quoteLength.filter((ql) => ql !== len);
        }
      }
    } else {
      config.quoteLength = [len];
    }
  }
  // if (!nosave) setMode("quote", nosave);
  saveToLocalStorage("quoteLength", nosave);
  ConfigEvent.dispatch("quoteLength", config.quoteLength);

  return true;
}

export function setWordCount(
  wordCount: ConfigSchemas.WordCount,
  nosave?: boolean
): boolean {
  if (isConfigChangeBlocked()) return false;

  wordCount =
    wordCount < 0 || wordCount > 100000 ? getDefaultConfig().words : wordCount;

  if (!isConfigValueValid("words", wordCount, ConfigSchemas.WordCountSchema))
    return false;

  if (!canSetConfigWithCurrentFunboxes("words", wordCount, config.funbox)) {
    return false;
  }

  config.words = wordCount;

  saveToLocalStorage("words", nosave);
  ConfigEvent.dispatch("words", config.words);

  return true;
}

//caret
export function setSmoothCaret(
  mode: ConfigSchemas.SmoothCaret,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("smooth caret", mode, ConfigSchemas.SmoothCaretSchema)
  ) {
    return false;
  }
  config.smoothCaret = mode;
  if (mode === "off") {
    $("#caret").css("animation-name", "caretFlashHard");
  } else {
    $("#caret").css("animation-name", "caretFlashSmooth");
  }

  saveToLocalStorage("smoothCaret", nosave);
  ConfigEvent.dispatch("smoothCaret", config.smoothCaret);

  return true;
}

export function setCodeUnindentOnBackspace(
  mode: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValidBoolean("code unindent on backspace", mode)) {
    return false;
  }
  config.codeUnindentOnBackspace = mode;

  saveToLocalStorage("codeUnindentOnBackspace", nosave);
  ConfigEvent.dispatch(
    "codeUnindentOnBackspace",
    config.codeUnindentOnBackspace,
    nosave
  );
  return true;
}

export function setStartGraphsAtZero(mode: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValidBoolean("start graphs at zero", mode)) {
    return false;
  }

  config.startGraphsAtZero = mode;
  saveToLocalStorage("startGraphsAtZero", nosave);
  ConfigEvent.dispatch("startGraphsAtZero", config.startGraphsAtZero);

  return true;
}

//linescroll
export function setSmoothLineScroll(mode: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValidBoolean("smooth line scroll", mode)) {
    return false;
  }

  config.smoothLineScroll = mode;
  saveToLocalStorage("smoothLineScroll", nosave);
  ConfigEvent.dispatch("smoothLineScroll", config.smoothLineScroll);

  return true;
}

//quick restart
export function setQuickRestartMode(
  mode: ConfigSchemas.QuickRestart,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "quick restart mode",
      mode,
      ConfigSchemas.QuickRestartSchema
    )
  ) {
    return false;
  }

  config.quickRestart = mode;
  saveToLocalStorage("quickRestart", nosave);
  ConfigEvent.dispatch("quickRestart", config.quickRestart);

  return true;
}

//font family
export function setFontFamily(
  font: ConfigSchemas.FontFamily,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("font family", font, ConfigSchemas.FontFamilySchema))
    return false;

  if (font === "") {
    font = "roboto_mono";
    Notifications.add(
      "Empty input received, reverted to the default font.",
      0,
      {
        customTitle: "Custom font",
      }
    );
  }
  if (!font || !/^[0-9a-zA-Z_.\-#+()]+$/.test(font)) {
    Notifications.add(`Invalid font name value: "${font}".`, -1, {
      customTitle: "Custom font",
      duration: 3,
    });
    return false;
  }
  config.fontFamily = font;
  document.documentElement.style.setProperty(
    "--font",
    `"${font.replace(/_/g, " ")}", "Roboto Mono", "Vazirmatn", monospace`
  );
  saveToLocalStorage("fontFamily", nosave);
  ConfigEvent.dispatch("fontFamily", config.fontFamily);

  return true;
}

//freedom
export function setFreedomMode(freedom: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValidBoolean("freedom mode", freedom)) return false;

  if (freedom === null || freedom === undefined) {
    freedom = false;
  }
  config.freedomMode = freedom;
  if (config.freedomMode && config.confidenceMode !== "off") {
    config.confidenceMode = "off";
  }
  saveToLocalStorage("freedomMode", nosave);
  ConfigEvent.dispatch("freedomMode", config.freedomMode);

  return true;
}

export function setConfidenceMode(
  cm: ConfigSchemas.ConfidenceMode,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "confidence mode",
      cm,
      ConfigSchemas.ConfidenceModeSchema
    )
  ) {
    return false;
  }

  config.confidenceMode = cm;
  if (config.confidenceMode !== "off") {
    config.freedomMode = false;
    config.stopOnError = "off";
    saveToLocalStorage("freedomMode", nosave);
    saveToLocalStorage("stopOnError", nosave);
  }
  saveToLocalStorage("confidenceMode", nosave);
  ConfigEvent.dispatch("confidenceMode", config.confidenceMode, nosave);

  return true;
}

export function setIndicateTypos(
  value: ConfigSchemas.IndicateTypos,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "indicate typos",
      value,
      ConfigSchemas.IndicateTyposSchema
    )
  ) {
    return false;
  }

  config.indicateTypos = value;
  saveToLocalStorage("indicateTypos", nosave);
  ConfigEvent.dispatch("indicateTypos", config.indicateTypos);

  return true;
}

export function setAutoSwitchTheme(
  boolean: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValidBoolean("auto switch theme", boolean)) {
    return false;
  }

  boolean = boolean ?? getDefaultConfig().autoSwitchTheme;
  config.autoSwitchTheme = boolean;
  saveToLocalStorage("autoSwitchTheme", nosave);
  ConfigEvent.dispatch("autoSwitchTheme", config.autoSwitchTheme);

  return true;
}

export function setCustomTheme(boolean: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValidBoolean("custom theme", boolean)) return false;

  config.customTheme = boolean;
  saveToLocalStorage("customTheme", nosave);
  ConfigEvent.dispatch("customTheme", config.customTheme);

  return true;
}

export function setTheme(
  name: ConfigSchemas.ThemeName,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("theme", name, ConfigSchemas.ThemeNameSchema))
    return false;

  config.theme = name;
  if (config.customTheme) setCustomTheme(false);
  saveToLocalStorage("theme", nosave);
  ConfigEvent.dispatch("theme", config.theme);

  return true;
}

export function setThemeLight(
  name: ConfigSchemas.ThemeName,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("theme light", name, ConfigSchemas.ThemeNameSchema))
    return false;

  config.themeLight = name;
  saveToLocalStorage("themeLight", nosave);
  ConfigEvent.dispatch("themeLight", config.themeLight, nosave);

  return true;
}

export function setThemeDark(
  name: ConfigSchemas.ThemeName,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("theme dark", name, ConfigSchemas.ThemeNameSchema))
    return false;

  config.themeDark = name;
  saveToLocalStorage("themeDark", nosave);
  ConfigEvent.dispatch("themeDark", config.themeDark, nosave);

  return true;
}

function setThemes(
  theme: ConfigSchemas.ThemeName,
  customState: boolean,
  customThemeColors: ConfigSchemas.CustomThemeColors,
  autoSwitchTheme: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("themes", theme, ConfigSchemas.ThemeNameSchema))
    return false;

  //@ts-expect-error config used to have 9
  if (customThemeColors.length === 9) {
    //color missing
    if (customState) {
      Notifications.add(
        "Missing sub alt color. Please edit it in the custom theme settings and save your changes.",
        0,
        {
          duration: 7,
        }
      );
    }
    customThemeColors.splice(4, 0, "#000000");
  }

  config.customThemeColors = customThemeColors;
  config.theme = theme;
  config.customTheme = customState;
  config.autoSwitchTheme = autoSwitchTheme;
  saveToLocalStorage("theme", nosave);
  ConfigEvent.dispatch("setThemes", customState);

  return true;
}

export function setRandomTheme(
  val: ConfigSchemas.RandomTheme,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("random theme", val, ConfigSchemas.RandomThemeSchema)
  ) {
    return false;
  }

  if (val === "custom") {
    if (!isAuthenticated()) {
      config.randomTheme = val;
      return false;
    }
    if (!DB.getSnapshot()) return true;
    if (DB.getSnapshot()?.customThemes?.length === 0) {
      Notifications.add("You need to create a custom theme first", 0);
      config.randomTheme = "off";
      return false;
    }
  }

  config.randomTheme = val;
  saveToLocalStorage("randomTheme", nosave);
  ConfigEvent.dispatch("randomTheme", config.randomTheme);

  return true;
}

export function setBritishEnglish(val: boolean, nosave?: boolean): boolean {
  if (isConfigChangeBlocked()) return false;

  if (!isConfigValueValidBoolean("british english", val)) return false;

  if (!val) {
    val = false;
  }
  config.britishEnglish = val;
  saveToLocalStorage("britishEnglish", nosave);
  ConfigEvent.dispatch("britishEnglish", config.britishEnglish);

  return true;
}

export function setLazyMode(val: boolean, nosave?: boolean): boolean {
  if (isConfigChangeBlocked()) return false;

  if (!isConfigValueValidBoolean("lazy mode", val)) return false;

  if (!val) {
    val = false;
  }
  config.lazyMode = val;
  saveToLocalStorage("lazyMode", nosave);
  ConfigEvent.dispatch("lazyMode", config.lazyMode, nosave);

  return true;
}

export function setCustomThemeColors(
  colors: ConfigSchemas.CustomThemeColors,
  nosave?: boolean
): boolean {
  // migrate existing configs missing sub alt color
  // @ts-expect-error legacy configs
  if (colors.length === 9) {
    //color missing
    Notifications.add(
      "Missing sub alt color. Please edit it in the custom theme settings and save your changes.",
      0,
      {
        duration: 7,
      }
    );
    colors.splice(4, 0, "#000000");
  }

  if (
    !isConfigValueValid(
      "custom theme colors",
      colors,
      ConfigSchemas.CustomThemeColorsSchema
    )
  ) {
    return false;
  }

  if (colors !== undefined) {
    config.customThemeColors = colors;
    // ThemeController.set("custom");
    // applyCustomThemeColors();
  }
  saveToLocalStorage("customThemeColors", nosave);
  ConfigEvent.dispatch("customThemeColors", config.customThemeColors, nosave);

  return true;
}

export function setLanguage(language: Language, nosave?: boolean): boolean {
  if (isConfigChangeBlocked()) return false;

  if (!isConfigValueValid("language", language, LanguageSchema)) return false;

  config.language = language;
  saveToLocalStorage("language", nosave);
  ConfigEvent.dispatch("language", config.language);

  return true;
}

export function setMonkey(monkey: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValidBoolean("monkey", monkey)) return false;

  config.monkey = monkey;
  saveToLocalStorage("monkey", nosave);
  ConfigEvent.dispatch("monkey", config.monkey);

  return true;
}

export function setKeymapMode(
  mode: ConfigSchemas.KeymapMode,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("keymap mode", mode, ConfigSchemas.KeymapModeSchema)
  ) {
    return false;
  }

  $(".activeKey").removeClass("activeKey");
  $(".keymapKey").attr("style", "");
  config.keymapMode = mode;
  saveToLocalStorage("keymapMode", nosave);
  ConfigEvent.dispatch("keymapMode", config.keymapMode, nosave);

  return true;
}

export function setKeymapLegendStyle(
  style: ConfigSchemas.KeymapLegendStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "keymap legend style",
      style,
      ConfigSchemas.KeymapLegendStyleSchema
    )
  ) {
    return false;
  }

  // Remove existing styles
  const keymapLegendStyles = ["lowercase", "uppercase", "blank", "dynamic"];
  keymapLegendStyles.forEach((name) => {
    $(".keymapLegendStyle").removeClass(name);
  });

  style = style || "lowercase";

  // Mutate the keymap in the DOM, if it exists.
  // 1. Remove everything
  $(".keymapKey > .letter").css("display", "");
  $(".keymapKey > .letter").css("text-transform", "");

  // 2. Append special styles onto the DOM elements
  if (style === "uppercase") {
    $(".keymapKey > .letter").css("text-transform", "capitalize");
  }
  if (style === "blank") {
    $(".keymapKey > .letter").css("display", "none");
  }

  // Update and save to cookie for persistence
  $(".keymapLegendStyle").addClass(style);
  config.keymapLegendStyle = style;
  saveToLocalStorage("keymapLegendStyle", nosave);
  ConfigEvent.dispatch("keymapLegendStyle", config.keymapLegendStyle);

  return true;
}

export function setKeymapStyle(
  style: ConfigSchemas.KeymapStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("keymap style", style, ConfigSchemas.KeymapStyleSchema)
  ) {
    return false;
  }

  style = style || "staggered";
  config.keymapStyle = style;
  saveToLocalStorage("keymapStyle", nosave);
  ConfigEvent.dispatch("keymapStyle", config.keymapStyle);

  return true;
}

export function setKeymapLayout(
  layout: ConfigSchemas.KeymapLayout,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "keymap layout",
      layout,
      ConfigSchemas.KeymapLayoutSchema
    )
  )
    return false;

  config.keymapLayout = layout;
  saveToLocalStorage("keymapLayout", nosave);
  ConfigEvent.dispatch("keymapLayout", config.keymapLayout);

  return true;
}

export function setKeymapShowTopRow(
  show: ConfigSchemas.KeymapShowTopRow,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "keymapShowTopRow",
      show,
      ConfigSchemas.KeymapShowTopRowSchema
    )
  ) {
    return false;
  }

  config.keymapShowTopRow = show;
  saveToLocalStorage("keymapShowTopRow", nosave);
  ConfigEvent.dispatch("keymapShowTopRow", config.keymapShowTopRow);

  return true;
}

export function setKeymapSize(
  keymapSize: ConfigSchemas.KeymapSize,
  nosave?: boolean
): boolean {
  //auto-fix values to avoid validation errors
  if (keymapSize < 0.5) keymapSize = 0.5;
  if (keymapSize > 3.5) keymapSize = 3.5;
  keymapSize = roundTo1(keymapSize);

  if (
    !isConfigValueValid(
      "keymap size",
      keymapSize,
      ConfigSchemas.KeymapSizeSchema
    )
  ) {
    return false;
  }

  config.keymapSize = keymapSize;

  $("#keymap").css("zoom", keymapSize);

  saveToLocalStorage("keymapSize", nosave);
  ConfigEvent.dispatch("keymapSize", config.keymapSize, nosave);

  // trigger a resize event to update the layout - handled in ui.ts:108
  $(window).trigger("resize");

  return true;
}

export function setLayout(
  layout: ConfigSchemas.Layout,
  nosave?: boolean
): boolean {
  if (isConfigChangeBlocked()) return false;

  if (!isConfigValueValid("layout", layout, ConfigSchemas.LayoutSchema))
    return false;

  config.layout = layout;
  saveToLocalStorage("layout", nosave);
  ConfigEvent.dispatch("layout", config.layout, nosave);

  return true;
}

// export function setSavedLayout(layout: string, nosave?: boolean): boolean {
//   if (layout === null || layout === undefined) {
//     layout = "qwerty";
//   }
//   config.savedLayout = layout;
//   setLayout(layout, nosave);

//   return true;
// }

export function setFontSize(
  fontSize: ConfigSchemas.FontSize,
  nosave?: boolean
): boolean {
  if (fontSize < 0) {
    fontSize = 1;
  }

  if (
    !isConfigValueValid("font size", fontSize, ConfigSchemas.FontSizeSchema)
  ) {
    return false;
  }

  config.fontSize = fontSize;

  $("#caret, #paceCaret, #liveStatsMini, #typingTest, #wordsInput").css(
    "fontSize",
    fontSize + "rem"
  );

  saveToLocalStorage("fontSize", nosave);
  ConfigEvent.dispatch("fontSize", config.fontSize, nosave);

  // trigger a resize event to update the layout - handled in ui.ts:108
  if (!nosave) $(window).trigger("resize");

  return true;
}

export function setMaxLineWidth(
  maxLineWidth: ConfigSchemas.MaxLineWidth,
  nosave?: boolean
): boolean {
  if (maxLineWidth < 20 && maxLineWidth !== 0) {
    maxLineWidth = 20;
  }
  if (maxLineWidth > 1000) {
    maxLineWidth = 1000;
  }

  if (
    !isConfigValueValid(
      "max line width",
      maxLineWidth,
      ConfigSchemas.MaxLineWidthSchema
    )
  ) {
    return false;
  }

  config.maxLineWidth = maxLineWidth;

  saveToLocalStorage("maxLineWidth", nosave);
  ConfigEvent.dispatch("maxLineWidth", config.maxLineWidth, nosave);

  // trigger a resize event to update the layout - handled in ui.ts:108
  $(window).trigger("resize");

  return true;
}

export function setCustomBackground(
  value: ConfigSchemas.CustomBackground,
  nosave?: boolean
): boolean {
  value = value.trim();
  if (
    !isConfigValueValid(
      "custom background",
      value,
      ConfigSchemas.CustomBackgroundSchema
    )
  )
    return false;

  config.customBackground = value;
  saveToLocalStorage("customBackground", nosave);
  ConfigEvent.dispatch("customBackground", config.customBackground);

  return true;
}

export function setCustomLayoutfluid(
  value: ConfigSchemas.CustomLayoutFluid,
  nosave?: boolean
): boolean {
  if (isConfigChangeBlocked()) return false;

  // Remove duplicates
  const deduped = Array.from(new Set(value));
  if (
    !isConfigValueValid(
      "layoutfluid",
      deduped,
      ConfigSchemas.CustomLayoutFluidSchema
    )
  ) {
    return false;
  }

  config.customLayoutfluid = deduped;
  saveToLocalStorage("customLayoutfluid", nosave);
  ConfigEvent.dispatch("customLayoutfluid", config.customLayoutfluid);

  return true;
}

export function setCustomPolyglot(
  value: ConfigSchemas.CustomPolyglot,
  nosave?: boolean
): boolean {
  if (isConfigChangeBlocked()) return false;

  // remove duplicates
  const deduped = Array.from(new Set(value));
  if (
    !isConfigValueValid(
      "customPolyglot",
      deduped,
      ConfigSchemas.CustomPolyglotSchema
    )
  )
    return false;

  config.customPolyglot = deduped;
  saveToLocalStorage("customPolyglot", nosave);
  ConfigEvent.dispatch("customPolyglot", config.customPolyglot);

  return true;
}

export function setCustomBackgroundSize(
  value: ConfigSchemas.CustomBackgroundSize,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "custom background size",
      value,
      ConfigSchemas.CustomBackgroundSizeSchema
    )
  ) {
    return false;
  }

  config.customBackgroundSize = value;
  saveToLocalStorage("customBackgroundSize", nosave);
  ConfigEvent.dispatch("customBackgroundSize", config.customBackgroundSize);

  return true;
}

export function setCustomBackgroundFilter(
  array: ConfigSchemas.CustomBackgroundFilter,
  nosave?: boolean
): boolean {
  // @ts-expect-error this used to be 5
  // need to convert existing configs using five values down to four
  if (array.length === 5) {
    array = [array[0], array[1], array[2], array[3]];
  }

  if (
    !isConfigValueValid(
      "custom background filter",
      array,
      ConfigSchemas.CustomBackgroundFilterSchema
    )
  ) {
    return false;
  }

  config.customBackgroundFilter = array;
  saveToLocalStorage("customBackgroundFilter", nosave);
  ConfigEvent.dispatch("customBackgroundFilter", config.customBackgroundFilter);

  return true;
}
export function setMonkeyPowerLevel(
  level: ConfigSchemas.MonkeyPowerLevel,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid(
      "monkey power level",
      level,
      ConfigSchemas.MonkeyPowerLevelSchema
    )
  ) {
    return false;
  }
  config.monkeyPowerLevel = level;
  saveToLocalStorage("monkeyPowerLevel", nosave);
  ConfigEvent.dispatch("monkeyPowerLevel", config.monkeyPowerLevel);

  return true;
}

export function setBurstHeatmap(value: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValidBoolean("burst heatmap", value)) return false;

  if (!value) {
    value = false;
  }
  config.burstHeatmap = value;
  saveToLocalStorage("burstHeatmap", nosave);
  ConfigEvent.dispatch("burstHeatmap", config.burstHeatmap);

  return true;
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
    setAds(configObj.ads, true);
    setThemeLight(configObj.themeLight, true);
    setThemeDark(configObj.themeDark, true);
    setThemes(
      configObj.theme,
      configObj.customTheme,
      configObj.customThemeColors,
      configObj.autoSwitchTheme,
      true
    );
    setCustomLayoutfluid(configObj.customLayoutfluid, true);
    setCustomPolyglot(configObj.customPolyglot, true);
    setCustomBackground(configObj.customBackground, true);
    setCustomBackgroundSize(configObj.customBackgroundSize, true);
    setCustomBackgroundFilter(configObj.customBackgroundFilter, true);
    setQuickRestartMode(configObj.quickRestart, true);
    setKeyTips(configObj.showKeyTips, true);
    setTimeConfig(configObj.time, true);
    setQuoteLength(configObj.quoteLength, true);
    setWordCount(configObj.words, true);
    setLanguage(configObj.language, true);
    setLayout(configObj.layout, true);
    setFontSize(configObj.fontSize, true);
    setMaxLineWidth(configObj.maxLineWidth, true);
    setFreedomMode(configObj.freedomMode, true);
    setCaretStyle(configObj.caretStyle, true);
    setPaceCaretStyle(configObj.paceCaretStyle, true);
    setDifficulty(configObj.difficulty, true);
    setBlindMode(configObj.blindMode, true);
    setQuickEnd(configObj.quickEnd, true);
    setFlipTestColors(configObj.flipTestColors, true);
    setColorfulMode(configObj.colorfulMode, true);
    setConfidenceMode(configObj.confidenceMode, true);
    setIndicateTypos(configObj.indicateTypos, true);
    setTimerStyle(configObj.timerStyle, true);
    setLiveSpeedStyle(configObj.liveSpeedStyle, true);
    setLiveAccStyle(configObj.liveAccStyle, true);
    setLiveBurstStyle(configObj.liveBurstStyle, true);
    setTimerColor(configObj.timerColor, true);
    setTimerOpacity(configObj.timerOpacity, true);
    setKeymapMode(configObj.keymapMode, true);
    setKeymapStyle(configObj.keymapStyle, true);
    setKeymapLegendStyle(configObj.keymapLegendStyle, true);
    setKeymapLayout(configObj.keymapLayout, true);
    setKeymapShowTopRow(configObj.keymapShowTopRow, true);
    setKeymapSize(configObj.keymapSize, true);
    setFontFamily(configObj.fontFamily, true);
    setSmoothCaret(configObj.smoothCaret, true);
    setCodeUnindentOnBackspace(configObj.codeUnindentOnBackspace, true);
    setSmoothLineScroll(configObj.smoothLineScroll, true);
    setAlwaysShowDecimalPlaces(configObj.alwaysShowDecimalPlaces, true);
    setAlwaysShowWordsHistory(configObj.alwaysShowWordsHistory, true);
    setSingleListCommandLine(configObj.singleListCommandLine, true);
    setCapsLockWarning(configObj.capsLockWarning, true);
    setPlaySoundOnError(configObj.playSoundOnError, true);
    setPlaySoundOnClick(configObj.playSoundOnClick, true);
    setSoundVolume(configObj.soundVolume, true);
    setStopOnError(configObj.stopOnError, true);
    setFavThemes(configObj.favThemes, true);
    setFunbox(configObj.funbox, true);
    setRandomTheme(configObj.randomTheme, true);
    setShowAllLines(configObj.showAllLines, true);
    setShowOutOfFocusWarning(configObj.showOutOfFocusWarning, true);
    setPaceCaret(configObj.paceCaret, true);
    setPaceCaretCustomSpeed(configObj.paceCaretCustomSpeed, true);
    setRepeatedPace(configObj.repeatedPace, true);
    setAccountChart(configObj.accountChart, true);
    setMinBurst(configObj.minBurst, true);
    setMinBurstCustomSpeed(configObj.minBurstCustomSpeed, true);
    setMinWpm(configObj.minWpm, true);
    setMinWpmCustomSpeed(configObj.minWpmCustomSpeed, true);
    setMinAcc(configObj.minAcc, true);
    setMinAccCustom(configObj.minAccCustom, true);
    setHighlightMode(configObj.highlightMode, true);
    setTypingSpeedUnit(configObj.typingSpeedUnit, true);
    setHideExtraLetters(configObj.hideExtraLetters, true);
    setStartGraphsAtZero(configObj.startGraphsAtZero, true);
    setStrictSpace(configObj.strictSpace, true);
    setOppositeShiftMode(configObj.oppositeShiftMode, true);
    setMode(configObj.mode, true);
    setNumbers(configObj.numbers, true);
    setPunctuation(configObj.punctuation, true);
    setMonkey(configObj.monkey, true);
    setRepeatQuotes(configObj.repeatQuotes, true);
    setMonkeyPowerLevel(configObj.monkeyPowerLevel, true);
    setBurstHeatmap(configObj.burstHeatmap, true);
    setBritishEnglish(configObj.britishEnglish, true);
    setLazyMode(configObj.lazyMode, true);
    setShowAverage(configObj.showAverage, true);
    setTapeMode(configObj.tapeMode, true);
    setTapeMargin(configObj.tapeMargin, true);

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
