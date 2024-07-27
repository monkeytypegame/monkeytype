import * as DB from "./db";
import * as OutOfFocus from "./test/out-of-focus";
import * as Notifications from "./elements/notifications";
import {
  isConfigValueValid,
  isConfigValueValidAsync,
} from "./config-validation";
import * as ConfigEvent from "./observables/config-event";
import DefaultConfig from "./constants/default-config";
import { isAuthenticated } from "./firebase";
import * as AnalyticsController from "./controllers/analytics-controller";
import * as AccountButton from "./elements/account-button";
import { debounce } from "throttle-debounce";
import {
  canSetConfigWithCurrentFunboxes,
  canSetFunboxWithConfig,
} from "./test/funbox/funbox-validation";
import { isDevEnvironment, reloadAfter } from "./utils/misc";
import * as ConfigTypes from "@monkeytype/shared-types/config";

export let localStorageConfig: ConfigTypes.Config;

let loadDone: (value?: unknown) => void;

const config = {
  ...DefaultConfig,
};

let configToSend = {} as ConfigTypes.Config;
const saveToDatabase = debounce(1000, () => {
  if (Object.keys(configToSend).length > 0) {
    AccountButton.loading(true);
    void DB.saveConfig(configToSend).then(() => {
      AccountButton.loading(false);
    });
  }
  configToSend = {} as ConfigTypes.Config;
});

function saveToLocalStorage(
  key: keyof ConfigTypes.Config,
  nosave = false,
  noDbCheck = false
): void {
  if (nosave) return;

  const localToSave = config;

  const localToSaveStringified = JSON.stringify(localToSave);
  window.localStorage.setItem("config", localToSaveStringified);
  if (!noDbCheck) {
    (configToSend[key] as typeof config[typeof key]) = config[key];
    saveToDatabase();
  }
  ConfigEvent.dispatch("saveToLocalStorage", localToSaveStringified);
}

export function saveFullConfigToLocalStorage(noDbCheck = false): void {
  console.log("saving full config to localStorage");
  const save = config;
  const stringified = JSON.stringify(save);
  window.localStorage.setItem("config", stringified);
  if (!noDbCheck) {
    AccountButton.loading(true);
    void DB.saveConfig(save);
    AccountButton.loading(false);
  }
  ConfigEvent.dispatch("saveToLocalStorage", stringified);
}

//numbers
export function setNumbers(numb: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("numbers", numb, ["boolean"])) return false;

  if (!canSetConfigWithCurrentFunboxes("numbers", numb, config.funbox)) {
    return false;
  }

  if (config.mode === "quote") {
    numb = false;
  }
  config.numbers = numb;
  saveToLocalStorage("numbers", nosave);
  ConfigEvent.dispatch("numbers", config.numbers);

  return true;
}

//punctuation
export function setPunctuation(punc: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("punctuation", punc, ["boolean"])) return false;

  if (!canSetConfigWithCurrentFunboxes("punctuation", punc, config.funbox)) {
    return false;
  }

  if (config.mode === "quote") {
    punc = false;
  }
  config.punctuation = punc;
  saveToLocalStorage("punctuation", nosave);
  ConfigEvent.dispatch("punctuation", config.punctuation);

  return true;
}

export function setMode(mode: ConfigTypes.Mode, nosave?: boolean): boolean {
  if (
    !isConfigValueValid("mode", mode, [
      ["time", "words", "quote", "zen", "custom"],
    ])
  ) {
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
  val: ConfigTypes.PlaySoundOnError,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("play sound on error", val, [
      ["off", "1", "2", "3", "4"],
    ])
  ) {
    return false;
  }

  config.playSoundOnError = val;
  saveToLocalStorage("playSoundOnError", nosave);
  ConfigEvent.dispatch("playSoundOnError", config.playSoundOnError);

  return true;
}

export function setPlaySoundOnClick(
  val: ConfigTypes.PlaySoundOnClick,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("play sound on click", val, [
      [
        "off",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
      ],
    ])
  ) {
    return false;
  }

  config.playSoundOnClick = val;
  saveToLocalStorage("playSoundOnClick", nosave);
  ConfigEvent.dispatch("playSoundOnClick", config.playSoundOnClick);

  return true;
}

export function setSoundVolume(
  val: ConfigTypes.SoundVolume,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("sound volume", val, [["0.1", "0.5", "1.0"]])) {
    return false;
  }

  config.soundVolume = val;
  saveToLocalStorage("soundVolume", nosave);
  ConfigEvent.dispatch("soundVolume", config.soundVolume);

  return true;
}

//difficulty
export function setDifficulty(
  diff: ConfigTypes.Difficulty,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("difficulty", diff, [["normal", "expert", "master"]])
  ) {
    return false;
  }

  config.difficulty = diff;
  saveToLocalStorage("difficulty", nosave);
  ConfigEvent.dispatch("difficulty", config.difficulty, nosave);

  return true;
}

//set fav themes
export function setFavThemes(themes: string[], nosave?: boolean): boolean {
  if (!isConfigValueValid("favorite themes", themes, ["stringArray"])) {
    return false;
  }
  config.favThemes = themes;
  saveToLocalStorage("favThemes", nosave);
  ConfigEvent.dispatch("favThemes", config.favThemes);

  return true;
}

export function setFunbox(funbox: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("funbox", funbox, ["string"])) return false;

  for (const funbox of config.funbox.split("#")) {
    if (!canSetFunboxWithConfig(funbox, config)) {
      return false;
    }
  }

  const val = funbox ? funbox : "none";
  config.funbox = val;
  saveToLocalStorage("funbox", nosave);
  ConfigEvent.dispatch("funbox", config.funbox);

  return true;
}

export function toggleFunbox(
  funbox: string,
  nosave?: boolean
): number | boolean {
  if (!isConfigValueValid("funbox", funbox, ["string"])) return false;

  let r;

  const funboxArray = config.funbox.split("#");
  if (funboxArray[0] === "none") funboxArray.splice(0, 1);
  if (!funboxArray.includes(funbox)) {
    if (!canSetFunboxWithConfig(funbox, config)) {
      return false;
    }
    funboxArray.push(funbox);
    config.funbox = funboxArray.sort().join("#");
    r = funboxArray.indexOf(funbox);
  } else {
    r = funboxArray.indexOf(funbox);
    funboxArray.splice(r, 1);
    if (funboxArray.length === 0) {
      config.funbox = "none";
    } else {
      config.funbox = funboxArray.join("#");
    }
    r = -r - 1;
  }
  saveToLocalStorage("funbox", nosave);
  ConfigEvent.dispatch("funbox", config.funbox);

  return r;
}

export function setBlindMode(blind: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("blind mode", blind, ["boolean"])) return false;

  config.blindMode = blind;
  saveToLocalStorage("blindMode", nosave);
  ConfigEvent.dispatch("blindMode", config.blindMode, nosave);

  return true;
}

function setAccountChart(
  array: ConfigTypes.AccountChart,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("account chart", array, [["on", "off"], "stringArray"])
  ) {
    return false;
  }

  if (array.length !== 4) {
    array = ["on", "on", "on", "on"];
  }

  config.accountChart = array;
  saveToLocalStorage("accountChart", nosave);
  ConfigEvent.dispatch("accountChart", config.accountChart);

  return true;
}

export function setAccountChartResults(
  value: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("account chart results", value, ["boolean"])) {
    return false;
  }

  config.accountChart[0] = value ? "on" : "off";
  saveToLocalStorage("accountChart", nosave);
  ConfigEvent.dispatch("accountChart", config.accountChart);

  return true;
}

export function setAccountChartAccuracy(
  value: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("account chart accuracy", value, ["boolean"])) {
    return false;
  }

  config.accountChart[1] = value ? "on" : "off";
  saveToLocalStorage("accountChart", nosave);
  ConfigEvent.dispatch("accountChart", config.accountChart);

  return true;
}

export function setAccountChartAvg10(
  value: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("account chart avg 10", value, ["boolean"])) {
    return false;
  }

  config.accountChart[2] = value ? "on" : "off";
  saveToLocalStorage("accountChart", nosave);
  ConfigEvent.dispatch("accountChart", config.accountChart);

  return true;
}

export function setAccountChartAvg100(
  value: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("account chart avg 100", value, ["boolean"])) {
    return false;
  }

  config.accountChart[3] = value ? "on" : "off";
  saveToLocalStorage("accountChart", nosave);
  ConfigEvent.dispatch("accountChart", config.accountChart);

  return true;
}

export function setStopOnError(
  soe: ConfigTypes.StopOnError,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("stop on error", soe, [["off", "word", "letter"]])) {
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
  if (!isConfigValueValid("always show decimal places", val, ["boolean"])) {
    return false;
  }

  config.alwaysShowDecimalPlaces = val;
  saveToLocalStorage("alwaysShowDecimalPlaces", nosave);
  ConfigEvent.dispatch(
    "alwaysShowDecimalPlaces",
    config.alwaysShowDecimalPlaces
  );

  return true;
}

export function setTypingSpeedUnit(
  val: ConfigTypes.TypingSpeedUnit,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("typing speed unit", val, [
      ["wpm", "cpm", "wps", "cps", "wph"],
    ])
  ) {
    return false;
  }
  config.typingSpeedUnit = val;
  saveToLocalStorage("typingSpeedUnit", nosave);
  ConfigEvent.dispatch("typingSpeedUnit", config.typingSpeedUnit, nosave);

  return true;
}

export function setShowOutOfFocusWarning(
  val: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("show out of focus warning", val, ["boolean"])) {
    return false;
  }

  config.showOutOfFocusWarning = val;
  if (!config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  saveToLocalStorage("showOutOfFocusWarning", nosave);
  ConfigEvent.dispatch("showOutOfFocusWarning", config.showOutOfFocusWarning);

  return true;
}

//pace caret
export function setPaceCaret(
  val: ConfigTypes.PaceCaret,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("pace caret", val, [
      ["custom", "off", "average", "pb", "last", "daily"],
    ])
  ) {
    return false;
  }

  if (document.readyState === "complete") {
    if (val === "pb" && !isAuthenticated()) {
      Notifications.add("PB pace caret is unavailable without an account", 0);
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
  val: number,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("pace caret custom speed", val, ["number"])) {
    return false;
  }

  config.paceCaretCustomSpeed = val;
  saveToLocalStorage("paceCaretCustomSpeed", nosave);
  ConfigEvent.dispatch("paceCaretCustomSpeed", config.paceCaretCustomSpeed);

  return true;
}

export function setRepeatedPace(pace: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("repeated pace", pace, ["boolean"])) return false;

  config.repeatedPace = pace;
  saveToLocalStorage("repeatedPace", nosave);
  ConfigEvent.dispatch("repeatedPace", config.repeatedPace);

  return true;
}

//min wpm
export function setMinWpm(
  minwpm: ConfigTypes.MinimumWordsPerMinute,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("min speed", minwpm, [["off", "custom"]])) {
    return false;
  }

  config.minWpm = minwpm;
  saveToLocalStorage("minWpm", nosave);
  ConfigEvent.dispatch("minWpm", config.minWpm, nosave);

  return true;
}

export function setMinWpmCustomSpeed(val: number, nosave?: boolean): boolean {
  if (!isConfigValueValid("min speed custom", val, ["number"])) {
    return false;
  }

  config.minWpmCustomSpeed = val;
  saveToLocalStorage("minWpmCustomSpeed", nosave);
  ConfigEvent.dispatch("minWpmCustomSpeed", config.minWpmCustomSpeed);

  return true;
}

//min acc
export function setMinAcc(
  min: ConfigTypes.MinimumAccuracy,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("min acc", min, [["off", "custom"]])) return false;

  config.minAcc = min;
  saveToLocalStorage("minAcc", nosave);
  ConfigEvent.dispatch("minAcc", config.minAcc, nosave);

  return true;
}

export function setMinAccCustom(val: number, nosave?: boolean): boolean {
  if (!isConfigValueValid("min acc custom", val, ["number"])) return false;
  if (val > 100) val = 100;

  config.minAccCustom = val;
  saveToLocalStorage("minAccCustom", nosave);
  ConfigEvent.dispatch("minAccCustom", config.minAccCustom);

  return true;
}

//min burst
export function setMinBurst(
  min: ConfigTypes.MinimumBurst,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("min burst", min, [["off", "fixed", "flex"]])) {
    return false;
  }

  config.minBurst = min;
  saveToLocalStorage("minBurst", nosave);
  ConfigEvent.dispatch("minBurst", config.minBurst, nosave);

  return true;
}

export function setMinBurstCustomSpeed(val: number, nosave?: boolean): boolean {
  if (!isConfigValueValid("min burst custom speed", val, ["number"])) {
    return false;
  }

  config.minBurstCustomSpeed = val;
  saveToLocalStorage("minBurstCustomSpeed", nosave);
  ConfigEvent.dispatch("minBurstCustomSpeed", config.minBurstCustomSpeed);

  return true;
}

//always show words history
export function setAlwaysShowWordsHistory(
  val: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("always show words history", val, ["boolean"])) {
    return false;
  }

  config.alwaysShowWordsHistory = val;
  saveToLocalStorage("alwaysShowWordsHistory", nosave);
  ConfigEvent.dispatch("alwaysShowWordsHistory", config.alwaysShowWordsHistory);

  return true;
}

//single list command line
export function setSingleListCommandLine(
  option: ConfigTypes.SingleListCommandLine,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("single list command line", option, [["manual", "on"]])
  ) {
    return false;
  }

  config.singleListCommandLine = option;
  saveToLocalStorage("singleListCommandLine", nosave);
  ConfigEvent.dispatch("singleListCommandLine", config.singleListCommandLine);

  return true;
}

//caps lock warning
export function setCapsLockWarning(val: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("caps lock warning", val, ["boolean"])) return false;

  config.capsLockWarning = val;
  saveToLocalStorage("capsLockWarning", nosave);
  ConfigEvent.dispatch("capsLockWarning", config.capsLockWarning);

  return true;
}

export function setShowAllLines(sal: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("show all lines", sal, ["boolean"])) return false;

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
  if (!isConfigValueValid("quick end", qe, ["boolean"])) return false;

  config.quickEnd = qe;
  saveToLocalStorage("quickEnd", nosave);
  ConfigEvent.dispatch("quickEnd", config.quickEnd);

  return true;
}

export function setAds(val: ConfigTypes.Ads, nosave?: boolean): boolean {
  if (!isConfigValueValid("ads", val, [["off", "result", "on", "sellout"]])) {
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
  val: ConfigTypes.RepeatQuotes,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("repeat quotes", val, [["off", "typing"]])) {
    return false;
  }

  config.repeatQuotes = val;
  saveToLocalStorage("repeatQuotes", nosave);
  ConfigEvent.dispatch("repeatQuotes", config.repeatQuotes);

  return true;
}

//flip colors
export function setFlipTestColors(flip: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("flip test colors", flip, ["boolean"])) return false;

  config.flipTestColors = flip;
  saveToLocalStorage("flipTestColors", nosave);
  ConfigEvent.dispatch("flipTestColors", config.flipTestColors);

  return true;
}

//extra color
export function setColorfulMode(extra: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("colorful mode", extra, ["boolean"])) return false;

  config.colorfulMode = extra;
  saveToLocalStorage("colorfulMode", nosave);
  ConfigEvent.dispatch("colorfulMode", config.colorfulMode);

  return true;
}

//strict space
export function setStrictSpace(val: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("strict space", val, ["boolean"])) return false;

  config.strictSpace = val;
  saveToLocalStorage("strictSpace", nosave);
  ConfigEvent.dispatch("strictSpace", config.strictSpace);

  return true;
}

//opposite shift space
export function setOppositeShiftMode(
  val: ConfigTypes.OppositeShiftMode,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("opposite shift mode", val, [["off", "on", "keymap"]])
  ) {
    return false;
  }

  config.oppositeShiftMode = val;
  saveToLocalStorage("oppositeShiftMode", nosave);
  ConfigEvent.dispatch("oppositeShiftMode", config.oppositeShiftMode);

  return true;
}

export function setCaretStyle(
  caretStyle: ConfigTypes.CaretStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("caret style", caretStyle, [
      ["off", "default", "block", "outline", "underline", "carrot", "banana"],
    ])
  ) {
    return false;
  }

  config.caretStyle = caretStyle;
  $("#caret").removeClass("off");
  $("#caret").removeClass("default");
  $("#caret").removeClass("underline");
  $("#caret").removeClass("outline");
  $("#caret").removeClass("block");
  $("#caret").removeClass("carrot");
  $("#caret").removeClass("banana");

  if (caretStyle === "off") {
    $("#caret").addClass("off");
  } else if (caretStyle === "default") {
    $("#caret").addClass("default");
  } else if (caretStyle === "block") {
    $("#caret").addClass("block");
  } else if (caretStyle === "outline") {
    $("#caret").addClass("outline");
  } else if (caretStyle === "underline") {
    $("#caret").addClass("underline");
  } else if (caretStyle === "carrot") {
    $("#caret").addClass("carrot");
  } else if (caretStyle === "banana") {
    $("#caret").addClass("banana");
  }
  saveToLocalStorage("caretStyle", nosave);
  ConfigEvent.dispatch("caretStyle", config.caretStyle);

  return true;
}

export function setPaceCaretStyle(
  caretStyle: ConfigTypes.CaretStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("pace caret style", caretStyle, [
      ["off", "default", "block", "outline", "underline", "carrot", "banana"],
    ])
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
  value: ConfigTypes.ShowAverage,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("show average", value, [
      ["off", "speed", "acc", "both"],
    ])
  ) {
    return false;
  }

  config.showAverage = value;
  saveToLocalStorage("showAverage", nosave);
  ConfigEvent.dispatch("showAverage", config.showAverage, nosave);

  return true;
}

export function setHighlightMode(
  mode: ConfigTypes.HighlightMode,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("highlight mode", mode, [
      [
        "off",
        "letter",
        "word",
        "next_word",
        "next_two_words",
        "next_three_words",
      ],
    ])
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
  mode: ConfigTypes.TapeMode,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("tape mode", mode, [["off", "letter", "word"]])) {
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

export function setHideExtraLetters(val: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("hide extra letters", val, ["boolean"])) return false;

  config.hideExtraLetters = val;
  saveToLocalStorage("hideExtraLetters", nosave);
  ConfigEvent.dispatch("hideExtraLetters", config.hideExtraLetters);

  return true;
}

export function setTimerStyle(
  style: ConfigTypes.TimerStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("timer style", style, [["off", "bar", "text", "mini"]])
  ) {
    return false;
  }

  config.timerStyle = style;
  saveToLocalStorage("timerStyle", nosave);
  ConfigEvent.dispatch("timerStyle", config.timerStyle);

  return true;
}

export function setLiveSpeedStyle(
  style: ConfigTypes.LiveSpeedAccBurstStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("live speed style", style, [["off", "text", "mini"]])
  ) {
    return false;
  }

  config.liveSpeedStyle = style;
  saveToLocalStorage("liveSpeedStyle", nosave);
  ConfigEvent.dispatch("liveSpeedStyle", config.timerStyle);

  return true;
}

export function setLiveAccStyle(
  style: ConfigTypes.LiveSpeedAccBurstStyle,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("live acc style", style, [["off", "text", "mini"]])) {
    return false;
  }

  config.liveAccStyle = style;
  saveToLocalStorage("liveAccStyle", nosave);
  ConfigEvent.dispatch("liveAccStyle", config.timerStyle);

  return true;
}

export function setLiveBurstStyle(
  style: ConfigTypes.LiveSpeedAccBurstStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("live burst style", style, [["off", "text", "mini"]])
  ) {
    return false;
  }

  config.liveBurstStyle = style;
  saveToLocalStorage("liveBurstStyle", nosave);
  ConfigEvent.dispatch("liveBurstStyle", config.timerStyle);

  return true;
}

export function setTimerColor(
  color: ConfigTypes.TimerColor,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("timer color", color, [
      ["black", "sub", "text", "main"],
    ])
  ) {
    return false;
  }

  config.timerColor = color;

  saveToLocalStorage("timerColor", nosave);
  ConfigEvent.dispatch("timerColor", config.timerColor);

  return true;
}
export function setTimerOpacity(
  opacity: ConfigTypes.TimerOpacity,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("timer opacity", opacity, [
      ["0.25", "0.5", "0.75", "1"],
    ])
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
  if (!isConfigValueValid("key tips", keyTips, ["boolean"])) return false;

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
export function setTimeConfig(time: number, nosave?: boolean): boolean {
  if (!isConfigValueValid("time", time, ["number"])) return false;

  if (!canSetConfigWithCurrentFunboxes("words", time, config.funbox)) {
    return false;
  }

  const newTime = isNaN(time) || time < 0 ? DefaultConfig.time : time;

  config.time = newTime;

  saveToLocalStorage("time", nosave);
  ConfigEvent.dispatch("time", config.time);

  return true;
}

//quote length
export function setQuoteLength(
  len: ConfigTypes.QuoteLength[] | ConfigTypes.QuoteLength,
  nosave?: boolean,
  multipleMode?: boolean
): boolean {
  if (
    !isConfigValueValid("quote length", len, [
      [-3, -2, -1, 0, 1, 2, 3],
      "numberArray",
    ])
  ) {
    return false;
  }

  if (Array.isArray(len)) {
    //config load
    if (len.length === 1 && len[0] === -1) len = [1];
    config.quoteLength = len;
  } else {
    if (!Array.isArray(config.quoteLength)) config.quoteLength = [];
    if (len === null || isNaN(len) || len < -3 || len > 3) {
      len = 1;
    }
    len = parseInt(len.toString()) as ConfigTypes.QuoteLength;

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

export function setWordCount(wordCount: number, nosave?: boolean): boolean {
  if (!isConfigValueValid("words", wordCount, ["number"])) return false;

  if (!canSetConfigWithCurrentFunboxes("words", wordCount, config.funbox)) {
    return false;
  }

  const newWordCount =
    wordCount < 0 || wordCount > 100000 ? DefaultConfig.words : wordCount;

  config.words = newWordCount;

  saveToLocalStorage("words", nosave);
  ConfigEvent.dispatch("words", config.words);

  return true;
}

//caret
export function setSmoothCaret(
  mode: ConfigTypes.Config["smoothCaret"],
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("smooth caret", mode, [
      ["off", "slow", "medium", "fast"],
    ])
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

export function setStartGraphsAtZero(mode: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("start graphs at zero", mode, ["boolean"])) {
    return false;
  }

  config.startGraphsAtZero = mode;
  saveToLocalStorage("startGraphsAtZero", nosave);
  ConfigEvent.dispatch("startGraphsAtZero", config.startGraphsAtZero);

  return true;
}

//linescroll
export function setSmoothLineScroll(mode: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("smooth line scroll", mode, ["boolean"])) {
    return false;
  }

  config.smoothLineScroll = mode;
  saveToLocalStorage("smoothLineScroll", nosave);
  ConfigEvent.dispatch("smoothLineScroll", config.smoothLineScroll);

  return true;
}

//quick restart
export function setQuickRestartMode(
  mode: "off" | "esc" | "tab" | "enter",
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("quick restart mode", mode, [
      ["off", "esc", "tab", "enter"],
    ])
  ) {
    return false;
  }

  config.quickRestart = mode;
  saveToLocalStorage("quickRestart", nosave);
  ConfigEvent.dispatch("quickRestart", config.quickRestart);

  return true;
}

//font family
export function setFontFamily(font: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("font family", font, ["string"])) return false;

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
  if (!isConfigValueValid("freedom mode", freedom, ["boolean"])) return false;

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
  cm: ConfigTypes.ConfidenceMode,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("confidence mode", cm, [["off", "on", "max"]])) {
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
  value: ConfigTypes.IndicateTypos,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("indicate typos", value, [["off", "below", "replace"]])
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
  if (!isConfigValueValid("auto switch theme", boolean, ["boolean"])) {
    return false;
  }

  boolean = boolean ?? DefaultConfig.autoSwitchTheme;
  config.autoSwitchTheme = boolean;
  saveToLocalStorage("autoSwitchTheme", nosave);
  ConfigEvent.dispatch("autoSwitchTheme", config.autoSwitchTheme);

  return true;
}

export function setCustomTheme(boolean: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("custom theme", boolean, ["boolean"])) return false;

  config.customTheme = boolean;
  saveToLocalStorage("customTheme", nosave);
  ConfigEvent.dispatch("customTheme", config.customTheme);

  return true;
}

export function setTheme(name: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("theme", name, ["string"])) return false;

  config.theme = name;
  if (config.customTheme) setCustomTheme(false);
  saveToLocalStorage("theme", nosave);
  ConfigEvent.dispatch("theme", config.theme);

  return true;
}

export function setThemeLight(name: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("theme light", name, ["string"])) return false;

  config.themeLight = name;
  saveToLocalStorage("themeLight", nosave);
  ConfigEvent.dispatch("themeLight", config.themeLight, nosave);

  return true;
}

export function setThemeDark(name: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("theme dark", name, ["string"])) return false;

  config.themeDark = name;
  saveToLocalStorage("themeDark", nosave);
  ConfigEvent.dispatch("themeDark", config.themeDark, nosave);

  return true;
}

function setThemes(
  theme: string,
  customState: boolean,
  customThemeColors: string[],
  autoSwitchTheme: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("themes", theme, ["string"])) return false;

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
  val: ConfigTypes.RandomTheme,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("random theme", val, [
      ["off", "on", "fav", "light", "dark", "custom"],
    ])
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
  if (!isConfigValueValid("british english", val, ["boolean"])) return false;

  if (!val) {
    val = false;
  }
  config.britishEnglish = val;
  saveToLocalStorage("britishEnglish", nosave);
  ConfigEvent.dispatch("britishEnglish", config.britishEnglish);

  return true;
}

export function setLazyMode(val: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("lazy mode", val, ["boolean"])) return false;

  if (!val) {
    val = false;
  }
  config.lazyMode = val;
  saveToLocalStorage("lazyMode", nosave);
  ConfigEvent.dispatch("lazyMode", config.lazyMode, nosave);

  return true;
}

export function setCustomThemeColors(
  colors: string[],
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("custom theme colors", colors, ["stringArray"])) {
    return false;
  }

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

  if (colors !== undefined) {
    config.customThemeColors = colors;
    // ThemeController.set("custom");
    // applyCustomThemeColors();
  }
  saveToLocalStorage("customThemeColors", nosave);
  ConfigEvent.dispatch("customThemeColors", config.customThemeColors, nosave);

  return true;
}

export function setLanguage(language: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("language", language, ["string"])) return false;

  config.language = language;
  void AnalyticsController.log("changedLanguage", { language });
  saveToLocalStorage("language", nosave);
  ConfigEvent.dispatch("language", config.language);

  return true;
}

export function setMonkey(monkey: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("monkey", monkey, ["boolean"])) return false;

  config.monkey = monkey;
  saveToLocalStorage("monkey", nosave);
  ConfigEvent.dispatch("monkey", config.monkey);

  return true;
}

export function setKeymapMode(
  mode: ConfigTypes.KeymapMode,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("keymap mode", mode, [
      ["off", "static", "react", "next"],
    ])
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
  style: ConfigTypes.KeymapLegendStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("keymap legend style", style, [
      ["lowercase", "uppercase", "blank", "dynamic"],
    ])
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
  style: ConfigTypes.KeymapStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("keymap style", style, [
      [
        "staggered",
        "alice",
        "matrix",
        "split",
        "split_matrix",
        "steno",
        "steno_matrix",
      ],
    ])
  ) {
    return false;
  }

  style = style || "staggered";
  config.keymapStyle = style;
  saveToLocalStorage("keymapStyle", nosave);
  ConfigEvent.dispatch("keymapStyle", config.keymapStyle);

  return true;
}

export function setKeymapLayout(layout: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("keymap layout", layout, ["string"])) return false;

  config.keymapLayout = layout;
  saveToLocalStorage("keymapLayout", nosave);
  ConfigEvent.dispatch("keymapLayout", config.keymapLayout);

  return true;
}

export function setKeymapShowTopRow(
  show: ConfigTypes.KeymapShowTopRow,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("keymapShowTopRow", show, [
      ["always", "layout", "never"],
    ])
  ) {
    return false;
  }

  config.keymapShowTopRow = show;
  saveToLocalStorage("keymapShowTopRow", nosave);
  ConfigEvent.dispatch("keymapShowTopRow", config.keymapShowTopRow);

  return true;
}

export function setLayout(layout: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("layout", layout, ["string"])) return false;

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

export function setFontSize(fontSize: number, nosave?: boolean): boolean {
  if (
    typeof fontSize === "string" &&
    ["1", "125", "15", "2", "3", "4"].includes(fontSize)
  ) {
    if (fontSize === "125") {
      fontSize = 1.25;
    } else if (fontSize === "15") {
      fontSize = 1.5;
    } else {
      fontSize = parseInt(fontSize);
    }
  }

  if (!isConfigValueValid("font size", fontSize, ["number"])) {
    return false;
  }

  if (fontSize < 0) {
    fontSize = 1;
  }

  // i dont know why the above check is not enough
  // some people are getting font size 15 when it should be converted to 1.5
  // after converting from the string to float system

  // keeping this in for now, if you want a big font go 14.9 or something
  if (fontSize === 15) {
    fontSize = 1.5;
  }

  config.fontSize = fontSize;

  $("#caret, #paceCaret, #liveStatsMini, #typingTest").css(
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
  maxLineWidth: number,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("max line width", maxLineWidth, ["number"])) {
    return false;
  }

  if (maxLineWidth < 20 && maxLineWidth !== 0) {
    maxLineWidth = 20;
  }
  if (maxLineWidth > 1000) {
    maxLineWidth = 1000;
  }

  config.maxLineWidth = maxLineWidth;

  saveToLocalStorage("maxLineWidth", nosave);
  ConfigEvent.dispatch("maxLineWidth", config.maxLineWidth, nosave);

  // trigger a resize event to update the layout - handled in ui.ts:108
  $(window).trigger("resize");

  return true;
}

export function setCustomBackground(value: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("custom background", value, ["string"])) return false;

  value = value.trim();
  if (
    (/(https|http):\/\/(www\.|).+\..+\/.+(\.png|\.gif|\.jpeg|\.jpg)/gi.test(
      value
    ) &&
      !/[<> "]/.test(value)) ||
    value === ""
  ) {
    config.customBackground = value;
    saveToLocalStorage("customBackground", nosave);
    ConfigEvent.dispatch("customBackground", config.customBackground);
  } else {
    Notifications.add("Invalid custom background URL", 0);
  }

  return true;
}

export async function setCustomLayoutfluid(
  value: MonkeyTypes.CustomLayoutFluidSpaces,
  nosave?: boolean
): Promise<boolean> {
  const trimmed = value.trim();

  if (
    !(await isConfigValueValidAsync("layoutfluid", trimmed, ["layoutfluid"]))
  ) {
    return false;
  }

  const customLayoutfluid = trimmed.replace(
    / /g,
    "#"
  ) as ConfigTypes.CustomLayoutFluid;

  config.customLayoutfluid = customLayoutfluid;
  saveToLocalStorage("customLayoutfluid", nosave);
  ConfigEvent.dispatch("customLayoutFluid", config.customLayoutfluid);

  return true;
}

export function setCustomBackgroundSize(
  value: ConfigTypes.CustomBackgroundSize,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("custom background size", value, [
      ["max", "cover", "contain"],
    ])
  ) {
    return false;
  }

  config.customBackgroundSize = value;
  saveToLocalStorage("customBackgroundSize", nosave);
  ConfigEvent.dispatch("customBackgroundSize", config.customBackgroundSize);

  return true;
}

export function setCustomBackgroundFilter(
  array: ConfigTypes.CustomBackgroundFilter,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("custom background filter", array, ["numberArray"])) {
    return false;
  }

  config.customBackgroundFilter = array;
  saveToLocalStorage("customBackgroundFilter", nosave);
  ConfigEvent.dispatch("customBackgroundFilter", config.customBackgroundFilter);

  return true;
}

export function setMonkeyPowerLevel(
  level: ConfigTypes.MonkeyPowerLevel,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("monkey power level", level, [
      ["off", "1", "2", "3", "4"],
    ])
  ) {
    return false;
  }

  if (!["off", "1", "2", "3", "4"].includes(level)) level = "off";
  config.monkeyPowerLevel = level;
  saveToLocalStorage("monkeyPowerLevel", nosave);
  ConfigEvent.dispatch("monkeyPowerLevel", config.monkeyPowerLevel);

  return true;
}

export function setBurstHeatmap(value: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("burst heatmap", value, ["boolean"])) return false;

  if (!value) {
    value = false;
  }
  config.burstHeatmap = value;
  saveToLocalStorage("burstHeatmap", nosave);
  ConfigEvent.dispatch("burstHeatmap", config.burstHeatmap);

  return true;
}

export async function apply(
  configToApply: ConfigTypes.Config | MonkeyTypes.ConfigChanges
): Promise<void> {
  if (configToApply === undefined) return;

  ConfigEvent.dispatch("fullConfigChange");

  configToApply = replaceLegacyValues(configToApply);

  const configObj = configToApply as ConfigTypes.Config;
  (Object.keys(DefaultConfig) as (keyof ConfigTypes.Config)[]).forEach(
    (configKey) => {
      if (configObj[configKey] === undefined) {
        const newValue = DefaultConfig[configKey];
        (configObj[configKey] as typeof newValue) = newValue;
      }
    }
  );
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
    await setCustomLayoutfluid(configObj.customLayoutfluid, true);
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
    setFontFamily(configObj.fontFamily, true);
    setSmoothCaret(configObj.smoothCaret, true);
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
  await apply(DefaultConfig);
  saveFullConfigToLocalStorage();
}

export async function loadFromLocalStorage(): Promise<void> {
  console.log("loading localStorage config");
  const newConfigString = window.localStorage.getItem("config");
  let newConfig: ConfigTypes.Config;
  if (
    newConfigString !== undefined &&
    newConfigString !== null &&
    newConfigString !== ""
  ) {
    try {
      newConfig = JSON.parse(newConfigString);
    } catch (e) {
      newConfig = {} as ConfigTypes.Config;
    }
    await apply(newConfig);
    localStorageConfig = newConfig;
    saveFullConfigToLocalStorage(true);
  } else {
    await reset();
  }
  // TestLogic.restart(false, true);
  loadDone();
}

function replaceLegacyValues(
  configToApply: ConfigTypes.Config | MonkeyTypes.ConfigChanges
): ConfigTypes.Config | MonkeyTypes.ConfigChanges {
  const configObj = configToApply as ConfigTypes.Config;

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
    let val: ConfigTypes.LiveSpeedAccBurstStyle = "mini";
    if (configObj.timerStyle !== "bar" && configObj.timerStyle !== "off") {
      val = configObj.timerStyle;
    }
    configObj.liveSpeedStyle = val;
  }

  //@ts-expect-error
  if (configObj.showLiveBurst === true) {
    let val: ConfigTypes.LiveSpeedAccBurstStyle = "mini";
    if (configObj.timerStyle !== "bar" && configObj.timerStyle !== "off") {
      val = configObj.timerStyle;
    }
    configObj.liveBurstStyle = val;
  }

  //@ts-expect-error
  if (configObj.showLiveAcc === true) {
    let val: ConfigTypes.LiveSpeedAccBurstStyle = "mini";
    if (configObj.timerStyle !== "bar" && configObj.timerStyle !== "off") {
      val = configObj.timerStyle;
    }
    configObj.liveAccStyle = val;
  }

  return configObj;
}

export function getConfigChanges(): MonkeyTypes.PresetConfig {
  const configChanges = {} as MonkeyTypes.PresetConfig;
  (Object.keys(config) as (keyof ConfigTypes.Config)[])
    .filter((key) => {
      return config[key] !== DefaultConfig[key];
    })
    .forEach((key) => {
      (configChanges[key] as typeof config[typeof key]) = config[key];
    });
  return configChanges;
}

export const loadPromise = new Promise((v) => {
  loadDone = v;
});

export default config;
