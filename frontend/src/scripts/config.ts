import * as DB from "./db";
import * as OutOfFocus from "./test/out-of-focus";
import * as Notifications from "./elements/notifications";
import {
  isConfigKeyValid,
  isConfigValueValid,
  isConfigValueValidAsync,
} from "./config-validation";
import * as ConfigEvent from "./observables/config-event";
import DefaultConfig from "./constants/default-config";

export let localStorageConfig: MonkeyTypes.Config;
export let dbConfigLoaded = false;
export let changedBeforeDb = false;

export function setLocalStorageConfig(val: MonkeyTypes.Config): void {
  localStorageConfig = val;
}

export function setDbConfigLoaded(val: boolean): void {
  dbConfigLoaded = val;
}

export function setChangedBeforeDb(val: boolean): void {
  changedBeforeDb = val;
}

let loadDone: (value?: unknown) => void;

let config = {
  ...DefaultConfig,
};

async function saveToLocalStorage(
  key: keyof MonkeyTypes.Config,
  nosave = false,
  noDbCheck = false
): Promise<void> {
  if (!dbConfigLoaded && !noDbCheck && !nosave) {
    setChangedBeforeDb(true);
  }

  if (nosave) return;

  const dbToSave = {} as MonkeyTypes.Config;
  (dbToSave[key] as typeof config[typeof key]) = config[key];
  const localToSave = config;
  delete localToSave.resultFilters;
  delete dbToSave.resultFilters;

  const localToSaveStringified = JSON.stringify(localToSave);
  window.localStorage.setItem("config", localToSaveStringified);
  if (!noDbCheck) {
    await DB.saveConfig(dbToSave);
  }
  ConfigEvent.dispatch("saveToLocalStorage", localToSaveStringified);
}

export async function saveFullConfigToLocalStorage(
  noDbCheck = false
): Promise<void> {
  if (!dbConfigLoaded && !noDbCheck) {
    setChangedBeforeDb(true);
  }
  const save = config;
  delete save.resultFilters;
  const stringified = JSON.stringify(save);
  window.localStorage.setItem("config", stringified);
  if (!noDbCheck) await DB.saveConfig(save);
  ConfigEvent.dispatch("saveToLocalStorage", stringified);
}

//numbers
export function setNumbers(numb: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("numbers", numb, ["boolean"])) return false;

  if (config.mode === "quote") {
    numb = false;
  }
  config.numbers = numb;
  if (!config.numbers) {
    $("#top .config .numbersMode .text-button").removeClass("active");
  } else {
    $("#top .config .numbersMode .text-button").addClass("active");
  }
  saveToLocalStorage("numbers", nosave);
  ConfigEvent.dispatch("numbers", config.numbers);

  return true;
}

//punctuation
export function setPunctuation(punc: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("punctuation", punc, ["boolean"])) return false;

  if (config.mode === "quote") {
    punc = false;
  }
  config.punctuation = punc;
  if (!config.punctuation) {
    $("#top .config .punctuationMode .text-button").removeClass("active");
  } else {
    $("#top .config .punctuationMode .text-button").addClass("active");
  }
  saveToLocalStorage("punctuation", nosave);
  ConfigEvent.dispatch("punctuation", config.punctuation);

  return true;
}

export function setMode(mode: MonkeyTypes.Mode, nosave?: boolean): boolean {
  if (
    !isConfigValueValid("mode", mode, [
      ["time", "words", "quote", "zen", "custom"],
    ])
  ) {
    return false;
  }

  if (mode !== "words" && config.funbox === "memory") {
    Notifications.add("Memory funbox can only be used with words mode.", 0);
    return false;
  }
  const previous = config.mode;
  config.mode = mode;
  if (config.mode == "custom") {
    setPunctuation(false, true);
    setNumbers(false, true);
  } else if (config.mode == "quote") {
    setPunctuation(false, true);
    setNumbers(false, true);
  } else if (config.mode == "zen") {
    if (config.paceCaret != "off") {
      Notifications.add(`Pace caret will not work with zen mode.`, 0);
    }
  }
  saveToLocalStorage("mode", nosave);
  ConfigEvent.dispatch("mode", config.mode, nosave, previous);

  return true;
}

export function setPlaySoundOnError(val: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("play sound on error", val, ["boolean"])) {
    return false;
  }

  config.playSoundOnError = val;
  saveToLocalStorage("playSoundOnError", nosave);
  ConfigEvent.dispatch("playSoundOnError", config.playSoundOnError);

  return true;
}

export function setPlaySoundOnClick(
  val: MonkeyTypes.PlaySoundOnClick,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("play sound on click", val, [
      ["off", "1", "2", "3", "4", "5", "6", "7"],
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
  val: MonkeyTypes.SoundVolume,
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
  diff: MonkeyTypes.Difficulty,
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

  const val = funbox ? funbox : "none";
  config.funbox = val;
  saveToLocalStorage("funbox", nosave);
  ConfigEvent.dispatch("funbox", config.funbox);

  return true;
}

export function setBlindMode(blind: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("blind mode", blind, ["boolean"])) return false;

  config.blindMode = blind;
  saveToLocalStorage("blindMode", nosave);
  ConfigEvent.dispatch("blindMode", config.blindMode, nosave);

  return true;
}

export function setChartAccuracy(
  chartAccuracy: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("chart accuracy", chartAccuracy, ["boolean"])) {
    return false;
  }

  config.chartAccuracy = chartAccuracy;
  saveToLocalStorage("chartAccuracy", nosave);
  ConfigEvent.dispatch("chartAccuracy", config.chartAccuracy);

  return true;
}

export function setChartStyle(
  chartStyle: MonkeyTypes.ChartStyle,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("chart style", chartStyle, [["line", "scatter"]])) {
    return false;
  }

  config.chartStyle = chartStyle;
  saveToLocalStorage("chartStyle", nosave);
  ConfigEvent.dispatch("chartStyle", config.chartStyle);

  return true;
}

export function setStopOnError(
  soe: MonkeyTypes.StopOnError,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("stop on error", soe, [["off", "word", "letter"]])) {
    return false;
  }

  config.stopOnError = soe;
  if (config.stopOnError !== "off") {
    config.confidenceMode = "off";
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

export function setAlwaysShowCPM(val: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("always show CPM", val, ["boolean"])) return false;

  config.alwaysShowCPM = val;
  saveToLocalStorage("alwaysShowCPM", nosave);
  ConfigEvent.dispatch("alwaysShowCPM", config.alwaysShowCPM);

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

export function setSwapEscAndTab(val: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("swap esc and tab", val, ["boolean"])) return false;

  config.swapEscAndTab = val;
  saveToLocalStorage("swapEscAndTab", nosave);
  ConfigEvent.dispatch("swapEscAndTab", config.swapEscAndTab);

  return true;
}

//pace caret
export function setPaceCaret(
  val: MonkeyTypes.PaceCaret,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("pace caret", val, [["custom", "off", "average", "pb"]])
  ) {
    return false;
  }

  if (document.readyState === "complete") {
    if (val == "pb" && firebase.auth().currentUser === null) {
      Notifications.add("PB pace caret is unavailable without an account", 0);
      return false;
    }
  }
  // if (config.mode === "zen" && val != "off") {
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
  minwpm: MonkeyTypes.MinimumWordsPerMinute,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("min WPM", minwpm, [["off", "custom"]])) return false;

  config.minWpm = minwpm;
  saveToLocalStorage("minWpm", nosave);
  ConfigEvent.dispatch("minWpm", config.minWpm, nosave);

  return true;
}

export function setMinWpmCustomSpeed(val: number, nosave?: boolean): boolean {
  if (!isConfigValueValid("min WPM custom speed", val, ["number"])) {
    return false;
  }

  config.minWpmCustomSpeed = val;
  saveToLocalStorage("minWpmCustomSpeed", nosave);
  ConfigEvent.dispatch("minWpmCustomSpeed", config.minWpmCustomSpeed);

  return true;
}

//min acc
export function setMinAcc(
  min: MonkeyTypes.MinimumAccuracy,
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

  config.minAccCustom = val;
  saveToLocalStorage("minAccCustom", nosave);
  ConfigEvent.dispatch("minAccCustom", config.minAccCustom);

  return true;
}

//min burst
export function setMinBurst(
  min: MonkeyTypes.MinimumBurst,
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
  option: MonkeyTypes.SingleListCommandLine,
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

export function setEnableAds(
  val: MonkeyTypes.EnableAds,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("enable ads", val, [["on", "off", "max"]])) {
    return false;
  }

  config.enableAds = val;
  if (!nosave) {
    saveToLocalStorage("enableAds", nosave);
    setTimeout(() => {
      location.reload();
    }, 3000);
    Notifications.add("Ad settings changed. Refreshing...", 0);
  }

  return true;
}

export function setRepeatQuotes(
  val: MonkeyTypes.RepeatQuotes,
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
  val: MonkeyTypes.OppositeShiftMode,
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

export function setPageWidth(
  val: MonkeyTypes.PageWidth,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("page width", val, [
      ["max", "100", "125", "150", "200"],
    ])
  ) {
    return false;
  }

  config.pageWidth = val;
  $("#centerContent").removeClass("wide125");
  $("#centerContent").removeClass("wide150");
  $("#centerContent").removeClass("wide200");
  $("#centerContent").removeClass("widemax");

  if (val !== "100") {
    $("#centerContent").addClass("wide" + val);
  }
  saveToLocalStorage("pageWidth", nosave);
  ConfigEvent.dispatch("pageWidth", config.pageWidth);

  return true;
}

export function setCaretStyle(
  caretStyle: MonkeyTypes.CaretStyle,
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

  if (caretStyle == "off") {
    $("#caret").addClass("off");
  } else if (caretStyle == "default") {
    $("#caret").addClass("default");
  } else if (caretStyle == "block") {
    $("#caret").addClass("block");
  } else if (caretStyle == "outline") {
    $("#caret").addClass("outline");
  } else if (caretStyle == "underline") {
    $("#caret").addClass("underline");
  } else if (caretStyle == "carrot") {
    $("#caret").addClass("carrot");
  } else if (caretStyle == "banana") {
    $("#caret").addClass("banana");
  }
  saveToLocalStorage("caretStyle", nosave);
  ConfigEvent.dispatch("caretStyle", config.caretStyle);

  return true;
}

export function setPaceCaretStyle(
  caretStyle: MonkeyTypes.CaretStyle,
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

  if (caretStyle == "default") {
    $("#paceCaret").addClass("default");
  } else if (caretStyle == "block") {
    $("#paceCaret").addClass("block");
  } else if (caretStyle == "outline") {
    $("#paceCaret").addClass("outline");
  } else if (caretStyle == "underline") {
    $("#paceCaret").addClass("underline");
  } else if (caretStyle == "carrot") {
    $("#paceCaret").addClass("carrot");
  } else if (caretStyle == "banana") {
    $("#paceCaret").addClass("banana");
  }
  saveToLocalStorage("paceCaretStyle", nosave);
  ConfigEvent.dispatch("paceCaretStyle", config.paceCaretStyle);

  return true;
}

export function setShowTimerProgress(
  timer: boolean,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("show timer progress", timer, ["boolean"])) {
    return false;
  }

  config.showTimerProgress = timer;
  saveToLocalStorage("showTimerProgress", nosave);
  ConfigEvent.dispatch("showTimerProgress", config.showTimerProgress);

  return true;
}

export function setShowLiveWpm(live: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("show live WPM", live, ["boolean"])) return false;

  config.showLiveWpm = live;
  saveToLocalStorage("showLiveWpm", nosave);
  ConfigEvent.dispatch("showLiveWpm", config.showLiveWpm);

  return true;
}

export function setShowLiveAcc(live: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("show live acc", live, ["boolean"])) return false;

  config.showLiveAcc = live;
  saveToLocalStorage("showLiveAcc", nosave);
  ConfigEvent.dispatch("showLiveAcc", config.showLiveAcc);

  return true;
}

export function setShowLiveBurst(live: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("show live burst", live, ["boolean"])) return false;

  config.showLiveBurst = live;
  saveToLocalStorage("showLiveBurst", nosave);
  ConfigEvent.dispatch("showLiveBurst", config.showLiveBurst);

  return true;
}

export function setShowAvg(live: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("show average", live, ["boolean"])) return false;

  config.showAvg = live;
  saveToLocalStorage("showAvg", nosave);
  ConfigEvent.dispatch("showAvg", config.showAvg, nosave);

  return true;
}

export function setHighlightMode(
  mode: MonkeyTypes.HighlightMode,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("highlight mode", mode, [["off", "letter", "word"]])
  ) {
    return false;
  }

  if (
    mode === "word" &&
    (config.funbox === "nospace" ||
      config.funbox === "read_ahead" ||
      config.funbox === "read_ahead_easy" ||
      config.funbox === "read_ahead_hard" ||
      config.funbox === "tts" ||
      config.funbox === "arrows")
  ) {
    Notifications.add("Can't use word highlight with this funbox", 0);
    return false;
  }

  config.highlightMode = mode;
  saveToLocalStorage("highlightMode", nosave);
  ConfigEvent.dispatch("highlightMode", config.highlightMode);

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
  style: MonkeyTypes.TimerStyle,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("timer style", style, [["bar", "text", "mini"]])) {
    return false;
  }

  config.timerStyle = style;
  saveToLocalStorage("timerStyle", nosave);
  ConfigEvent.dispatch("timerStyle", config.timerStyle);

  return true;
}

export function setTimerColor(
  color: MonkeyTypes.TimerColor,
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

  $("#timer").removeClass("timerSub");
  $("#timer").removeClass("timerText");
  $("#timer").removeClass("timerMain");

  $("#timerNumber").removeClass("timerSub");
  $("#timerNumber").removeClass("timerText");
  $("#timerNumber").removeClass("timerMain");

  $("#largeLiveWpmAndAcc").removeClass("timerSub");
  $("#largeLiveWpmAndAcc").removeClass("timerText");
  $("#largeLiveWpmAndAcc").removeClass("timerMain");

  $("#miniTimerAndLiveWpm").removeClass("timerSub");
  $("#miniTimerAndLiveWpm").removeClass("timerText");
  $("#miniTimerAndLiveWpm").removeClass("timerMain");

  if (color === "main") {
    $("#timer").addClass("timerMain");
    $("#timerNumber").addClass("timerMain");
    $("#largeLiveWpmAndAcc").addClass("timerMain");
    $("#miniTimerAndLiveWpm").addClass("timerMain");
  } else if (color === "sub") {
    $("#timer").addClass("timerSub");
    $("#timerNumber").addClass("timerSub");
    $("#largeLiveWpmAndAcc").addClass("timerSub");
    $("#miniTimerAndLiveWpm").addClass("timerSub");
  } else if (color === "text") {
    $("#timer").addClass("timerText");
    $("#timerNumber").addClass("timerText");
    $("#largeLiveWpmAndAcc").addClass("timerText");
    $("#miniTimerAndLiveWpm").addClass("timerText");
  }

  saveToLocalStorage("timerColor", nosave);
  ConfigEvent.dispatch("timerColor", config.timerColor);

  return true;
}
export function setTimerOpacity(
  opacity: MonkeyTypes.TimerOpacity,
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
    $("#bottom .keyTips").removeClass("hidden");
  } else {
    $("#bottom .keyTips").addClass("hidden");
  }
  saveToLocalStorage("showKeyTips", nosave);
  ConfigEvent.dispatch("showKeyTips", config.showKeyTips);

  return true;
}

//mode
export function setTimeConfig(
  time: MonkeyTypes.TimeModes,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("time", time, ["number"])) return false;

  const newTime = isNaN(time) || time < 0 ? DefaultConfig.time : time;

  $("#top .config .time .text-button").removeClass("active");

  const timeCustom = ![15, 30, 60, 120].includes(newTime) ? "custom" : newTime;

  config.time = newTime;

  $(
    "#top .config .time .text-button[timeConfig='" + timeCustom + "']"
  ).addClass("active");
  saveToLocalStorage("time", nosave);
  ConfigEvent.dispatch("time", config.time);

  return true;
}

//quote length
export function setQuoteLength(
  len: MonkeyTypes.QuoteLength[] | MonkeyTypes.QuoteLength,
  nosave?: boolean,
  multipleMode?: boolean
): boolean {
  if (
    !isConfigValueValid("quote length", len, [
      [-2, -1, 0, 1, 2, 3],
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
    if (len === null || isNaN(len) || len < -2 || len > 3) {
      len = 1;
    }
    len = parseInt(len.toString()) as MonkeyTypes.QuoteLength;
    if (multipleMode) {
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
  $("#top .config .quoteLength .text-button").removeClass("active");
  config.quoteLength.forEach((ql) => {
    $(
      "#top .config .quoteLength .text-button[quoteLength='" + ql + "']"
    ).addClass("active");
  });
  saveToLocalStorage("quoteLength", nosave);
  ConfigEvent.dispatch("quoteLength", config.quoteLength);

  return true;
}

export function setWordCount(
  wordCount: MonkeyTypes.WordsModes,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("words", wordCount, ["number"])) return false;

  const newWordCount =
    wordCount < 0 || wordCount > 100000 ? DefaultConfig.words : wordCount;

  $("#top .config .wordCount .text-button").removeClass("active");

  const wordCustom = ![10, 25, 50, 100, 200].includes(newWordCount)
    ? "custom"
    : newWordCount;

  config.words = newWordCount;

  $(
    "#top .config .wordCount .text-button[wordCount='" + wordCustom + "']"
  ).addClass("active");
  saveToLocalStorage("words", nosave);
  ConfigEvent.dispatch("words", config.words);

  return true;
}

//caret
export function setSmoothCaret(mode: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("smooth caret", mode, ["boolean"])) return false;

  config.smoothCaret = mode;
  if (mode) {
    $("#caret").css("animation-name", "caretFlashSmooth");
  } else {
    $("#caret").css("animation-name", "caretFlashHard");
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

//quick tab
export function setQuickTabMode(mode: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("quick tab mode", mode, ["boolean"])) return false;

  config.quickTab = mode;
  if (!config.quickTab) {
    $("#restartTestButton").removeClass("hidden");
    $("#restartTestButton").css("opacity", 1);
    $("#bottom .keyTips")
      .html(`<key>tab</key> and <key>enter</key> / <key>space</key> - restart test<br>
      <key>ctrl/cmd</key>+<key>shift</key>+<key>p</key> or <key>esc</key> - command line`);
  } else {
    $("#restartTestButton").addClass("hidden");
    $("#bottom .keyTips").html(`<key>tab</key> - restart test<br>
    <key>ctrl/cmd</key>+<key>shift</key>+<key>p</key> or <key>esc</key> - command line`);
  }
  saveToLocalStorage("quickTab", nosave);
  ConfigEvent.dispatch("quickTab", config.quickTab);

  return true;
}

export function previewFontFamily(font: string): boolean {
  if (!isConfigValueValid("preview font family", font, ["string"])) {
    return false;
  }

  document.documentElement.style.setProperty(
    "--font",
    '"' + font.replace(/_/g, " ") + '", "Roboto Mono"'
  );

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
      3,
      "Custom font"
    );
  }
  if (!isConfigKeyValid(font)) {
    Notifications.add(
      `Invalid font name value: "${font}".`,
      -1,
      3,
      "Custom font"
    );
    return false;
  }
  config.fontFamily = font;
  document.documentElement.style.setProperty(
    "--font",
    `"${font.replace(/_/g, " ")}", "Roboto Mono"`
  );
  saveToLocalStorage("fontFamily", nosave);
  ConfigEvent.dispatch("fontFamily", config.fontFamily);

  return true;
}

//freedom
export function setFreedomMode(freedom: boolean, nosave?: boolean): boolean {
  if (!isConfigValueValid("freedom mode", freedom, ["boolean"])) return false;

  if (freedom == null) {
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
  cm: MonkeyTypes.ConfidenceMode,
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("confidence mode", cm, [["off", "on", "max"]])) {
    return false;
  }

  config.confidenceMode = cm;
  if (config.confidenceMode !== "off") {
    config.freedomMode = false;
    config.stopOnError = "off";
  }
  saveToLocalStorage("confidenceMode", nosave);
  ConfigEvent.dispatch("confidenceMode", config.confidenceMode, nosave);

  return true;
}

export function setIndicateTypos(
  value: MonkeyTypes.IndicateTypos,
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
  setCustomTheme(false, true);
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
  nosave?: boolean
): boolean {
  if (!isConfigValueValid("themes", theme, ["string"])) return false;

  config.customThemeColors = customThemeColors;
  config.theme = theme;
  config.customTheme = customState;
  saveToLocalStorage("theme", nosave);
  ConfigEvent.dispatch("setThemes", customState);

  return true;
}

export function setRandomTheme(
  val: MonkeyTypes.RandomTheme,
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
    setCustomTheme(true);
    if (firebase.auth().currentUser === null) {
      config.randomTheme = val;
      return false;
    }
    if (!DB.getSnapshot()) return true;
    if (DB.getSnapshot().customThemes.length === 0) {
      Notifications.add("You need to create a custom theme first", 0);
      config.randomTheme = "off";
      return false;
    }
  }
  if (val !== "off" && val !== "custom") setCustomTheme(false);

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
  try {
    firebase.analytics().logEvent("changedLanguage", {
      language: language,
    });
  } catch (e) {
    console.log("Analytics unavailable");
  }
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
  mode: MonkeyTypes.KeymapMode,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("keymap mode", mode, [
      ["off", "static", "react", "next"],
    ])
  ) {
    return false;
  }

  $(".active-key").removeClass("active-key");
  $(".keymap-key").attr("style", "");
  config.keymapMode = mode;
  saveToLocalStorage("keymapMode", nosave);
  ConfigEvent.dispatch("keymapMode", config.keymapMode, nosave);

  return true;
}

export function setKeymapLegendStyle(
  style: MonkeyTypes.KeymapLegendStyle,
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
  $(".keymap-key > .letter").css("display", "");
  $(".keymap-key > .letter").css("text-transform", "");

  // 2. Append special styles onto the DOM elements
  if (style === "uppercase") {
    $(".keymap-key > .letter").css("text-transform", "capitalize");
  }
  if (style === "blank") {
    $(".keymap-key > .letter").css("display", "none");
  }

  // Update and save to cookie for persistence
  $(".keymapLegendStyle").addClass(style);
  config.keymapLegendStyle = style;
  saveToLocalStorage("keymapLegendStyle", nosave);
  ConfigEvent.dispatch("keymapLegendStyle", config.keymapLegendStyle);

  return true;
}

export function setKeymapStyle(
  style: MonkeyTypes.KeymapStyle,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("keymap style", style, [
      ["staggered", "alice", "matrix", "split", "split_matrix"],
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

export function setLayout(layout: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("layout", layout, ["string"])) return false;

  config.layout = layout;
  saveToLocalStorage("layout", nosave);
  ConfigEvent.dispatch("layout", config.layout, nosave);

  return true;
}

// export function setSavedLayout(layout: string, nosave?: boolean): boolean {
//   if (layout == null || layout == undefined) {
//     layout = "qwerty";
//   }
//   config.savedLayout = layout;
//   setLayout(layout, nosave);

//   return true;
// }

export function setFontSize(
  fontSize: MonkeyTypes.FontSize,
  nosave?: boolean
): boolean {
  fontSize = fontSize.toString() as MonkeyTypes.FontSize; //todo remove after around a week
  if (
    !isConfigValueValid("font size", fontSize, [
      ["1", "125", "15", "2", "3", "4"],
    ])
  ) {
    return false;
  }

  config.fontSize = fontSize;
  $("#words").removeClass("size125");
  $("#caret, #paceCaret").removeClass("size125");
  $("#words").removeClass("size15");
  $("#caret, #paceCaret").removeClass("size15");
  $("#words").removeClass("size2");
  $("#caret, #paceCaret").removeClass("size2");
  $("#words").removeClass("size3");
  $("#caret, #paceCaret").removeClass("size3");
  $("#words").removeClass("size35");
  $("#caret, #paceCaret").removeClass("size35");
  $("#words").removeClass("size4");
  $("#caret, #paceCaret").removeClass("size4");

  $("#miniTimerAndLiveWpm").removeClass("size125");
  $("#miniTimerAndLiveWpm").removeClass("size15");
  $("#miniTimerAndLiveWpm").removeClass("size2");
  $("#miniTimerAndLiveWpm").removeClass("size3");
  $("#miniTimerAndLiveWpm").removeClass("size35");
  $("#miniTimerAndLiveWpm").removeClass("size4");

  if (fontSize == "125") {
    $("#words").addClass("size125");
    $("#caret, #paceCaret").addClass("size125");
    $("#miniTimerAndLiveWpm").addClass("size125");
  } else if (fontSize == "15") {
    $("#words").addClass("size15");
    $("#caret, #paceCaret").addClass("size15");
    $("#miniTimerAndLiveWpm").addClass("size15");
  } else if (fontSize == "2") {
    $("#words").addClass("size2");
    $("#caret, #paceCaret").addClass("size2");
    $("#miniTimerAndLiveWpm").addClass("size2");
  } else if (fontSize == "3") {
    $("#words").addClass("size3");
    $("#caret, #paceCaret").addClass("size3");
    $("#miniTimerAndLiveWpm").addClass("size3");
  } else if (fontSize == "4") {
    $("#words").addClass("size4");
    $("#caret, #paceCaret").addClass("size4");
    $("#miniTimerAndLiveWpm").addClass("size4");
  }
  saveToLocalStorage("fontSize", nosave);
  ConfigEvent.dispatch("fontSize", config.fontSize);

  return true;
}

export function setCustomBackground(value: string, nosave?: boolean): boolean {
  if (!isConfigValueValid("custom background", value, ["string"])) return false;

  value = value.trim();
  if (
    (/(https|http):\/\/(www\.|).+\..+\/.+(\.png|\.gif|\.jpeg|\.jpg)/gi.test(
      value
    ) &&
      !/[<>]/.test(value)) ||
    value == ""
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
  ) as MonkeyTypes.CustomLayoutFluid;

  config.customLayoutfluid = customLayoutfluid;
  $(".pageSettings .section.customLayoutfluid input").val(
    customLayoutfluid.replace(/#/g, " ")
  );
  saveToLocalStorage("customLayoutfluid", nosave);
  ConfigEvent.dispatch("customLayoutFluid", config.customLayoutfluid);

  return true;
}

export function setCustomBackgroundSize(
  value: MonkeyTypes.CustomBackgroundSize,
  nosave?: boolean
): boolean {
  if (
    !isConfigValueValid("custom background size", value, [
      ["max", "cover", "contain"],
    ])
  ) {
    return false;
  }

  if (value != "cover" && value != "contain" && value != "max") {
    value = "cover";
  }
  config.customBackgroundSize = value;
  saveToLocalStorage("customBackgroundSize", nosave);
  ConfigEvent.dispatch("customBackgroundSize", config.customBackgroundSize);

  return true;
}

export function setCustomBackgroundFilter(
  array: MonkeyTypes.CustomBackgroundFilter,
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
  level: MonkeyTypes.MonkeyPowerLevel,
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

export function apply(
  configToApply: MonkeyTypes.Config | MonkeyTypes.ConfigChanges
): void {
  if (!configToApply) return;
  const configObj = configToApply as MonkeyTypes.Config;
  (Object.keys(DefaultConfig) as (keyof MonkeyTypes.Config)[]).forEach(
    (configKey) => {
      if (configObj[configKey] === undefined) {
        const newValue = DefaultConfig[configKey];
        (configObj[configKey] as typeof newValue) = newValue;
      }
    }
  );
  if (configObj !== undefined && configObj !== null) {
    setThemeLight(configObj.themeLight, true);
    setThemeDark(configObj.themeDark, true);
    setAutoSwitchTheme(configObj.autoSwitchTheme, true);
    setThemes(
      configObj.theme,
      configObj.customTheme,
      configObj.customThemeColors,
      true
    );
    setCustomLayoutfluid(configObj.customLayoutfluid, true);
    setCustomBackground(configObj.customBackground, true);
    setCustomBackgroundSize(configObj.customBackgroundSize, true);
    setCustomBackgroundFilter(configObj.customBackgroundFilter, true);
    setQuickTabMode(configObj.quickTab, true);
    setKeyTips(configObj.showKeyTips, true);
    setTimeConfig(configObj.time, true);
    setQuoteLength(configObj.quoteLength, true);
    setWordCount(configObj.words, true);
    setLanguage(configObj.language, true);
    setLayout(configObj.layout, true);
    setFontSize(configObj.fontSize, true);
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
    setTimerColor(configObj.timerColor, true);
    setTimerOpacity(configObj.timerOpacity, true);
    setKeymapMode(configObj.keymapMode, true);
    setKeymapStyle(configObj.keymapStyle, true);
    setKeymapLegendStyle(configObj.keymapLegendStyle, true);
    setKeymapLayout(configObj.keymapLayout, true);
    setFontFamily(configObj.fontFamily, true);
    setSmoothCaret(configObj.smoothCaret, true);
    setSmoothLineScroll(configObj.smoothLineScroll, true);
    setShowLiveWpm(configObj.showLiveWpm, true);
    setShowLiveAcc(configObj.showLiveAcc, true);
    setShowLiveBurst(configObj.showLiveBurst, true);
    setShowTimerProgress(configObj.showTimerProgress, true);
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
    setSwapEscAndTab(configObj.swapEscAndTab, true);
    setShowOutOfFocusWarning(configObj.showOutOfFocusWarning, true);
    setPaceCaret(configObj.paceCaret, true);
    setPaceCaretCustomSpeed(configObj.paceCaretCustomSpeed, true);
    setRepeatedPace(configObj.repeatedPace, true);
    setPageWidth(configObj.pageWidth, true);
    setChartAccuracy(configObj.chartAccuracy, true);
    setChartStyle(configObj.chartStyle, true);
    setMinBurst(configObj.minBurst, true);
    setMinBurstCustomSpeed(configObj.minBurstCustomSpeed, true);
    setMinWpm(configObj.minWpm, true);
    setMinWpmCustomSpeed(configObj.minWpmCustomSpeed, true);
    setMinAcc(configObj.minAcc, true);
    setMinAccCustom(configObj.minAccCustom, true);
    setNumbers(configObj.numbers, true);
    setPunctuation(configObj.punctuation, true);
    setHighlightMode(configObj.highlightMode, true);
    setAlwaysShowCPM(configObj.alwaysShowCPM, true);
    setHideExtraLetters(configObj.hideExtraLetters, true);
    setStartGraphsAtZero(configObj.startGraphsAtZero, true);
    setStrictSpace(configObj.strictSpace, true);
    setOppositeShiftMode(configObj.oppositeShiftMode, true);
    setMode(configObj.mode, true);
    setMonkey(configObj.monkey, true);
    setRepeatQuotes(configObj.repeatQuotes, true);
    setMonkeyPowerLevel(configObj.monkeyPowerLevel, true);
    setBurstHeatmap(configObj.burstHeatmap, true);
    setBritishEnglish(configObj.britishEnglish, true);
    setLazyMode(configObj.lazyMode, true);
    setShowAvg(configObj.showAvg, true);

    try {
      setEnableAds(configObj.enableAds, true);
      // let addemo = false;
      // if (
      //   firebase.app().options.projectId === "monkey-type-dev-67af4" ||
      //   window.location.hostname === "localhost"
      // ) {
      //   addemo = true;
      // }

      if (config.enableAds === "max" || config.enableAds === "on") {
        $("head").append(`
          <script
          src="https://hb.vntsm.com/v3/live/ad-manager.min.js"
          type="text/javascript"
          data-site-id="60b78af12119122b8958910f"
          data-mode="scan"
          id="adScript"
          async
          ></script>
        `);

        if (config.enableAds === "max") {
          //

          $("#ad_rich_media").removeClass("hidden");
          $("#ad_rich_media").html(
            `<div class="vm-placement" data-id="60bf737ee04cb761c88aafb1" style="display:none"></div>`
          );
        } else {
          $("#ad_rich_media").remove();
        }

        //<div class="vm-placement" data-id="60bf73dae04cb761c88aafb5"></div>

        $("#ad_footer").html(
          `<div class="vm-placement" data-id="60bf73dae04cb761c88aafb5"></div>`
        );
        $("#ad_footer").removeClass("hidden");

        // $("#ad_footer2").html(`<div class="vm-placement" data-id="60bf73e9e04cb761c88aafb7"></div>`);
        // $("#ad_footer2").removeClass("hidden");

        $("#ad_about1").html(
          `<div class="vm-placement" data-id="60bf73dae04cb761c88aafb5"></div>`
        );
        $("#ad_about1").removeClass("hidden");

        $("#ad_about2").html(
          `<div class="vm-placement" data-id="60bf73dae04cb761c88aafb5"></div>`
        );
        $("#ad_about2").removeClass("hidden");

        $("#ad_settings0").html(
          `<div class="vm-placement" data-id="60bf73dae04cb761c88aafb5"></div>`
        );
        $("#ad_settings0").removeClass("hidden");

        $("#ad_settings1").html(
          `<div class="vm-placement" data-id="60bf73dae04cb761c88aafb5"></div>`
        );
        $("#ad_settings1").removeClass("hidden");

        $("#ad_settings2").html(
          `<div class="vm-placement" data-id="60bf73dae04cb761c88aafb5"></div>`
        );
        $("#ad_settings2").removeClass("hidden");

        $("#ad_settings3").html(
          `<div class="vm-placement" data-id="60bf73dae04cb761c88aafb5"></div>`
        );
        $("#ad_settings3").removeClass("hidden");

        $("#ad_account").html(
          `<div class="vm-placement" data-id="60bf73dae04cb761c88aafb5"></div>`
        );
        $("#ad_account").removeClass("hidden");
        $(".footerads").removeClass("hidden");
      } else {
        $("#adScript").remove();
        $(".footerads").remove();
        $("#ad_left").remove();
        $("#ad_right").remove();
        $("#ad_footer").remove();
        $("#ad_footer2").remove();
        $("#ad_footer3").remove();
        $("#ad_settings0").remove();
        $("#ad_settings1").remove();
        $("#ad_settings2").remove();
        $("#ad_settings3").remove();
        $("#ad_account").remove();
        $("#ad_about1").remove();
        $("#ad_about2").remove();
      }
    } catch (e) {
      Notifications.add("Error initialising ads: " + (e as Error).message);
      console.log("error initialising ads " + (e as Error).message);
      $(".footerads").remove();
      $("#ad_left").remove();
      $("#ad_right").remove();
      $("#ad_footer").remove();
      $("#ad_footer2").remove();
      $("#ad_footer3").remove();
      $("#ad_settings0").remove();
      $("#ad_settings1").remove();
      $("#ad_settings2").remove();
      $("#ad_settings3").remove();
      $("#ad_account").remove();
      $("#ad_about1").remove();
      $("#ad_about2").remove();
    }
    ConfigEvent.dispatch(
      "configApplied",
      undefined,
      undefined,
      undefined,
      config
    );
  }
}

export function reset(): void {
  config = {
    ...DefaultConfig,
  };
  apply(config);
  saveFullConfigToLocalStorage();
}

export function loadFromLocalStorage(): void {
  console.log("loading localStorage config");
  const newConfigString = window.localStorage.getItem("config");
  let newConfig: MonkeyTypes.Config;
  if (
    newConfigString !== undefined &&
    newConfigString !== null &&
    newConfigString !== ""
  ) {
    try {
      newConfig = JSON.parse(newConfigString);
    } catch (e) {
      newConfig = {} as MonkeyTypes.Config;
    }
    apply(newConfig);
    console.log("applying localStorage config");
    localStorageConfig = newConfig;
    saveFullConfigToLocalStorage(true);
    console.log("saving localStorage config");
  }
  // TestLogic.restart(false, true);
  loadDone();
}

export function getConfigChanges(): MonkeyTypes.PresetConfig {
  const configChanges = {} as MonkeyTypes.PresetConfig;
  (Object.keys(config) as (keyof MonkeyTypes.Config)[])
    .filter((key) => {
      return config[key] != DefaultConfig[key];
    })
    .forEach((key) => {
      (configChanges[key] as typeof config[typeof key]) = config[key];
    });
  return configChanges;
}

export function setConfig(newConfig: MonkeyTypes.Config): void {
  config = newConfig;
}

export const loadPromise = new Promise((v) => {
  loadDone = v;
});

export default config;
