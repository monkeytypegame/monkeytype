import * as DB from "./db";
import * as Sound from "./sound";
import * as TestUI from "./test-ui";
import * as ChartController from "./chart-controller";
import * as OutOfFocus from "./out-of-focus";
import * as TimerProgress from "./timer-progress";
import * as LiveWpm from "./live-wpm";
import * as LiveAcc from "./live-acc";
import * as LiveBurst from "./live-burst";
import * as Funbox from "./funbox";
import * as Notifications from "./notifications";
import * as ThemeController from "./theme-controller";
import * as Keymap from "./keymap";
import * as LanguagePicker from "./language-picker";
import * as TestLogic from "./test-logic";
import * as PaceCaret from "./pace-caret";
import * as UI from "./ui";
import * as CommandlineLists from "./commandline-lists";
import * as BackgroundFilter from "./custom-background-filter";
import LayoutList from "./layouts";
import * as ChallengeContoller from "./challenge-controller";
import * as TTS from "./tts";

export let localStorageConfig = null;
export let dbConfigLoaded = false;
export let changedBeforeDb = false;

export function setLocalStorageConfig(val) {
  localStorageConfig = val;
}

export function setDbConfigLoaded(val) {
  dbConfigLoaded = val;
}

export function setChangedBeforeDb(val) {
  changedBeforeDb = val;
}

let loadDone;

let defaultConfig = {
  theme: "serika_dark",
  customTheme: false,
  customThemeColors: [
    "#323437",
    "#e2b714",
    "#e2b714",
    "#646669",
    "#d1d0c5",
    "#ca4754",
    "#7e2a33",
    "#ca4754",
    "#7e2a33",
  ],
  favThemes: [],
  showKeyTips: true,
  showLiveWpm: false,
  showTimerProgress: true,
  smoothCaret: true,
  quickTab: false,
  punctuation: false,
  numbers: false,
  words: 50,
  time: 30,
  mode: "time",
  quoteLength: [1],
  language: "english",
  fontSize: 15,
  freedomMode: false,
  resultFilters: null,
  difficulty: "normal",
  blindMode: false,
  quickEnd: false,
  caretStyle: "default",
  paceCaretStyle: "default",
  flipTestColors: false,
  layout: "default",
  funbox: "none",
  confidenceMode: "off",
  indicateTypos: false,
  timerStyle: "mini",
  colorfulMode: false,
  randomTheme: "off",
  timerColor: "main",
  timerOpacity: "1",
  stopOnError: "off",
  showAllLines: false,
  keymapMode: "off",
  keymapStyle: "staggered",
  keymapLegendStyle: "lowercase",
  keymapLayout: "overrideSync",
  fontFamily: "Roboto_Mono",
  smoothLineScroll: false,
  alwaysShowDecimalPlaces: false,
  alwaysShowWordsHistory: false,
  singleListCommandLine: "manual",
  playSoundOnError: false,
  playSoundOnClick: "off",
  startGraphsAtZero: true,
  swapEscAndTab: false,
  showOutOfFocusWarning: true,
  paceCaret: "off",
  paceCaretCustomSpeed: 100,
  repeatedPace: true,
  pageWidth: "100",
  chartAccuracy: true,
  chartStyle: "line",
  minWpm: "off",
  minWpmCustomSpeed: 100,
  highlightMode: "letter",
  alwaysShowCPM: false,
  enableAds: "off",
  hideExtraLetters: false,
  strictSpace: false,
  minAcc: "off",
  minAccCustom: 90,
  showLiveAcc: false,
  showLiveBurst: false,
  monkey: false,
  repeatQuotes: "off",
  oppositeShiftMode: "off",
  customBackground: "",
  customBackgroundSize: "cover",
  customBackgroundFilter: [0, 1, 1, 1, 1],
  customLayoutfluid: "qwerty#dvorak#colemak",
  monkeyPowerLevel: "off",
  minBurst: "off",
  minBurstCustomSpeed: 100,
  burstHeatmap: false,
  britishEnglish: false,
  lazyMode: false,
};

function isConfigKeyValid(name) {
  if (name === null || name === undefined || name === "") return false;
  if (name.length > 30) return false;
  return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
}

let config = {
  ...defaultConfig,
};

export async function saveToLocalStorage(noDbCheck = false) {
  if (!dbConfigLoaded && !noDbCheck) {
    setChangedBeforeDb(true);
  }
  // let d = new Date();
  // d.setFullYear(d.getFullYear() + 1);
  // $.cookie("config", JSON.stringify(config), {
  //   expires: d,
  //   path: "/",
  // });
  let save = config;
  delete save.resultFilters;
  let stringified = JSON.stringify(save);
  window.localStorage.setItem("config", stringified);
  CommandlineLists.defaultCommands.list.filter(
    (command) => command.id == "exportSettingsJSON"
  )[0].defaultValue = stringified;
  // restartCount = 0;
  if (!noDbCheck) await DB.saveConfig(save);
}

//numbers
export function setNumbers(numb, nosave) {
  if (config.mode === "quote") {
    numb = false;
  }
  config.numbers = numb;
  if (!config.numbers) {
    $("#top .config .numbersMode .text-button").removeClass("active");
  } else {
    $("#top .config .numbersMode .text-button").addClass("active");
  }
  ChallengeContoller.clearActive();
  if (!nosave) saveToLocalStorage();
}

export function toggleNumbers() {
  config.numbers = !config.numbers;
  if (config.mode === "quote") {
    config.numbers = false;
  }
  if (config.numbers) {
    $("#top .config .numbersMode .text-button").addClass("active");
  } else {
    $("#top .config .numbersMode .text-button").removeClass("active");
  }
  saveToLocalStorage();
}

//punctuation
export function setPunctuation(punc, nosave) {
  if (config.mode === "quote") {
    punc = false;
  }
  config.punctuation = punc;
  if (!config.punctuation) {
    $("#top .config .punctuationMode .text-button").removeClass("active");
  } else {
    $("#top .config .punctuationMode .text-button").addClass("active");
  }
  ChallengeContoller.clearActive();
  if (!nosave) saveToLocalStorage();
}

export function togglePunctuation() {
  config.punctuation = !config.punctuation;
  if (config.mode === "quote") {
    config.punctuation = false;
  }
  if (config.punctuation) {
    $("#top .config .punctuationMode .text-button").addClass("active");
  } else {
    $("#top .config .punctuationMode .text-button").removeClass("active");
  }
  saveToLocalStorage();
}

export function setMode(mode, nosave) {
  if (TestUI.testRestarting) return;
  if (mode !== "words" && config.funbox === "memory") {
    Notifications.add("Memory funbox can only be used with words mode.", 0);
    return;
  }

  config.mode = mode;
  $("#top .config .mode .text-button").removeClass("active");
  $("#top .config .mode .text-button[mode='" + mode + "']").addClass("active");
  if (config.mode == "time") {
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").removeClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
  } else if (config.mode == "words") {
    $("#top .config .wordCount").removeClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
  } else if (config.mode == "custom") {
    if (
      config.funbox === "58008" ||
      config.funbox === "gibberish" ||
      config.funbox === "ascii"
    ) {
      Funbox.setActive("none");
      TestUI.updateModesNotice();
    }
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").removeClass("hidden");
    $("#top .config .punctuationMode").removeClass("disabled");
    $("#top .config .numbersMode").removeClass("disabled");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
    setPunctuation(false, true);
    setNumbers(false, true);
  } else if (config.mode == "quote") {
    setPunctuation(false, true);
    setNumbers(false, true);
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").addClass("disabled");
    $("#top .config .numbersMode").addClass("disabled");
    $("#top .config .punctuationMode").removeClass("hidden");
    $("#top .config .numbersMode").removeClass("hidden");
    $("#result .stats .source").removeClass("hidden");
    $("#top .config .quoteLength").removeClass("hidden");
  } else if (config.mode == "zen") {
    $("#top .config .wordCount").addClass("hidden");
    $("#top .config .time").addClass("hidden");
    $("#top .config .customText").addClass("hidden");
    $("#top .config .punctuationMode").addClass("hidden");
    $("#top .config .numbersMode").addClass("hidden");
    $("#top .config .quoteLength").addClass("hidden");
    if (config.paceCaret != "off") {
      Notifications.add(`Pace caret will not work with zen mode.`, 0);
    }
    // setPaceCaret("off", true);
  }
  ChallengeContoller.clearActive();
  if (!nosave) saveToLocalStorage();
}

export function setPlaySoundOnError(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.playSoundOnError = val;
  if (!nosave) saveToLocalStorage();
}

export function setPlaySoundOnClick(val, nosave) {
  if (val == undefined) {
    val = "off";
  }
  config.playSoundOnClick = val;
  if (config.playSoundOnClick !== "off") Sound.init();
  if (!nosave) saveToLocalStorage();
}

export function togglePlaySoundOnError() {
  config.playSoundOnError = !config.playSoundOnError;
  if (config.playSoundOnError == undefined) {
    config.playSoundOnError = false;
  }
}

//difficulty
export function setDifficulty(diff, nosave) {
  if (
    (diff !== "normal" && diff !== "expert" && diff !== "master") ||
    diff == undefined
  ) {
    diff = "normal";
  }
  config.difficulty = diff;
  if (!nosave) TestLogic.restart(false, nosave);
  TestUI.updateModesNotice();
  if (!nosave) saveToLocalStorage();
}

//set fav themes
export function setFavThemes(themes, nosave) {
  config.favThemes = themes;
  if (!nosave) {
    saveToLocalStorage();
  }
}

export function setFunbox(funbox, nosave) {
  let val = funbox ? funbox : "none";
  config.funbox = val;
  ChallengeContoller.clearActive();
  if (val === "none") {
    TTS.clear();
  } else if (val === "tts") {
    TTS.init();
  }
  if (!nosave) {
    saveToLocalStorage();
  }
}

//blind mode
export function toggleBlindMode() {
  let blind = !config.blindMode;
  if (blind == undefined) {
    blind = false;
  }
  config.blindMode = blind;
  TestUI.updateModesNotice();
  saveToLocalStorage();
}

export function setBlindMode(blind, nosave) {
  if (blind == undefined) {
    blind = false;
  }
  config.blindMode = blind;
  TestUI.updateModesNotice();
  if (!nosave) saveToLocalStorage();
}

function updateChartAccuracy() {
  ChartController.accountHistory.data.datasets[1].hidden = !config.chartAccuracy;
  ChartController.accountHistory.options.scales.yAxes[1].display =
    config.chartAccuracy;
  ChartController.accountHistory.update();
}

export function updateChartStyle() {
  if (config.chartStyle == "scatter") {
    ChartController.accountHistory.data.datasets[0].showLine = false;
    ChartController.accountHistory.data.datasets[1].showLine = false;
  } else {
    ChartController.accountHistory.data.datasets[0].showLine = true;
    ChartController.accountHistory.data.datasets[1].showLine = true;
  }
  ChartController.accountHistory.update();
}

export function toggleChartAccuracy() {
  if (config.chartAccuracy) {
    config.chartAccuracy = false;
  } else {
    config.chartAccuracy = true;
  }
  updateChartAccuracy();
  saveToLocalStorage();
}

export function setChartAccuracy(chartAccuracy, nosave) {
  if (chartAccuracy == undefined) {
    chartAccuracy = true;
  }
  config.chartAccuracy = chartAccuracy;
  updateChartAccuracy();
  if (!nosave) saveToLocalStorage();
}

export function toggleChartStyle() {
  if (config.chartStyle == "scatter") {
    config.chartStyle = "line";
  } else {
    config.chartStyle = "scatter";
  }
  updateChartStyle();
  saveToLocalStorage();
}

export function setChartStyle(chartStyle, nosave) {
  if (chartStyle == undefined) {
    chartStyle = "line";
  }
  config.chartStyle = chartStyle;
  updateChartStyle();
  if (!nosave) saveToLocalStorage();
}

export function setStopOnError(soe, nosave) {
  if (soe == undefined || soe === true || soe === false) {
    soe = "off";
  }
  config.stopOnError = soe;
  if (config.stopOnError !== "off") {
    config.confidenceMode = "off";
  }
  TestUI.updateModesNotice();
  if (!nosave) saveToLocalStorage();
}

//alwaysshowdecimal
export function toggleAlwaysShowDecimalPlaces() {
  config.alwaysShowDecimalPlaces = !config.alwaysShowDecimalPlaces;
  saveToLocalStorage();
}

export function setAlwaysShowDecimalPlaces(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.alwaysShowDecimalPlaces = val;
  if (!nosave) saveToLocalStorage();
}

export function toggleAlwaysShowCPM() {
  config.alwaysShowCPM = !config.alwaysShowCPM;
  saveToLocalStorage();
}

export function setAlwaysShowCPM(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.alwaysShowCPM = val;
  if (!nosave) saveToLocalStorage();
}

//show out of focus warning
export function toggleShowOutOfFocusWarning() {
  config.showOutOfFocusWarning = !config.showOutOfFocusWarning;
  if (!config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  saveToLocalStorage();
}

export function setShowOutOfFocusWarning(val, nosave) {
  if (val == undefined) {
    val = true;
  }
  config.showOutOfFocusWarning = val;
  if (!config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  if (!nosave) saveToLocalStorage();
}

//swap esc and tab
export function toggleSwapEscAndTab() {
  config.swapEscAndTab = !config.swapEscAndTab;
  saveToLocalStorage();
  UI.updateKeytips();
}

export function setSwapEscAndTab(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.swapEscAndTab = val;
  UI.updateKeytips();
  if (!nosave) saveToLocalStorage();
}

//pace caret
export function setPaceCaret(val, nosave) {
  if (val == undefined) {
    val = "off";
  }
  if (document.readyState === "complete") {
    if (val == "pb" && firebase.auth().currentUser === null) {
      Notifications.add("PB pace caret is unavailable without an account", 0);
      return;
    }
  }
  // if (config.mode === "zen" && val != "off") {
  //   Notifications.add(`Can't use pace caret with zen mode.`, 0);
  //   val = "off";
  // }
  config.paceCaret = val;
  ChallengeContoller.clearActive();
  TestUI.updateModesNotice();
  PaceCaret.init(nosave);
  if (!nosave) saveToLocalStorage();
}

export function setPaceCaretCustomSpeed(val, nosave) {
  if (val == undefined || Number.isNaN(parseInt(val))) {
    val = 100;
  }
  config.paceCaretCustomSpeed = val;
  if (!nosave) saveToLocalStorage();
}

//repeated pace
export function toggleRepeatedPace() {
  let pace = !config.repeatedPace;
  if (pace == undefined) {
    pace = true;
  }
  config.repeatedPace = pace;
  saveToLocalStorage();
}

export function setRepeatedPace(pace, nosave) {
  if (pace == undefined) {
    pace = true;
  }
  config.repeatedPace = pace;
  if (!nosave) saveToLocalStorage();
}

//min wpm
export function setMinWpm(minwpm, nosave) {
  if (minwpm == undefined) {
    minwpm = "off";
  }
  config.minWpm = minwpm;
  TestUI.updateModesNotice();
  if (!nosave) saveToLocalStorage();
}

export function setMinWpmCustomSpeed(val, nosave) {
  if (val == undefined || Number.isNaN(parseInt(val))) {
    val = 100;
  }
  config.minWpmCustomSpeed = val;
  if (!nosave) saveToLocalStorage();
}

//min acc
export function setMinAcc(min, nosave) {
  if (min == undefined) {
    min = "off";
  }
  config.minAcc = min;
  TestUI.updateModesNotice();
  if (!nosave) saveToLocalStorage();
}

export function setMinAccCustom(val, nosave) {
  if (val == undefined || Number.isNaN(parseInt(val))) {
    val = 90;
  }
  config.minAccCustom = val;
  if (!nosave) saveToLocalStorage();
}

//min burst
export function setMinBurst(min, nosave) {
  if (min == undefined) {
    min = "off";
  }
  config.minBurst = min;
  TestUI.updateModesNotice();
  if (!nosave) saveToLocalStorage();
}

export function setMinBurstCustomSpeed(val, nosave) {
  if (val == undefined || Number.isNaN(parseInt(val))) {
    val = 100;
  }
  config.minBurstCustomSpeed = val;
  if (!nosave) saveToLocalStorage();
}

//always show words history
export function setAlwaysShowWordsHistory(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.alwaysShowWordsHistory = val;
  if (!nosave) saveToLocalStorage();
}

export function toggleAlwaysShowWordsHistory() {
  let val = !config.alwaysShowWordsHistory;
  if (val == undefined) {
    val = false;
  }
  config.alwaysShowWordsHistory = val;
  saveToLocalStorage();
}

//single list command line
export function setSingleListCommandLine(option, nosave) {
  if (!option) option = "manual";
  config.singleListCommandLine = option;
  if (!nosave) saveToLocalStorage();
}

//show all lines
export function toggleShowAllLines() {
  let sal = !config.showAllLines;
  if (sal == undefined) {
    sal = false;
  }
  config.showAllLines = sal;
  TestLogic.restart();
  saveToLocalStorage();
}

export function setShowAllLines(sal, nosave) {
  if (sal == undefined) {
    sal = false;
  }
  config.showAllLines = sal;
  ChallengeContoller.clearActive();
  if (!nosave) {
    saveToLocalStorage();
    TestLogic.restart();
  }
}

//quickend
export function toggleQuickEnd() {
  let qe = !config.quickEnd;
  if (qe == undefined) {
    qe = false;
  }
  config.quickEnd = qe;
  saveToLocalStorage();
}

export function setQuickEnd(qe, nosave) {
  if (qe == undefined) {
    qe = false;
  }
  config.quickEnd = qe;
  if (!nosave) saveToLocalStorage();
}

export function setEnableAds(val, nosave) {
  if (val == undefined || val === true || val === false) {
    val = "off";
  }
  config.enableAds = val;
  if (!nosave) {
    saveToLocalStorage();
    setTimeout(() => {
      location.reload();
    }, 3000);
    Notifications.add("Ad settings changed. Refreshing...", 0);
  }
}

export function setRepeatQuotes(val, nosave) {
  if (val == undefined || val === true || val === false) {
    val = "off";
  }
  config.repeatQuotes = val;
  if (!nosave) saveToLocalStorage();
}

//flip colors
export function setFlipTestColors(flip, nosave) {
  if (flip == undefined) {
    flip = false;
  }
  config.flipTestColors = flip;
  TestUI.flipColors(flip);
  if (!nosave) saveToLocalStorage();
}

export function toggleFlipTestColors() {
  config.flipTestColors = !config.flipTestColors;
  TestUI.flipColors(config.flipTestColors);
  saveToLocalStorage();
}

//extra color
export function setColorfulMode(extra, nosave) {
  if (extra == undefined) {
    extra = false;
  }
  config.colorfulMode = extra;
  TestUI.colorful(extra);
  if (!nosave) saveToLocalStorage();
}

export function toggleColorfulMode() {
  config.colorfulMode = !config.colorfulMode;
  TestUI.colorful(config.colorfulMode);
  saveToLocalStorage();
}

//strict space
export function setStrictSpace(val, nosave) {
  if (val == undefined) {
    val = false;
  }
  config.strictSpace = val;
  if (!nosave) saveToLocalStorage();
}

export function toggleStrictSpace() {
  config.strictSpace = !config.strictSpace;
  saveToLocalStorage();
}

//opposite shift space
export function setOppositeShiftMode(val, nosave) {
  if (val == undefined) {
    val = "off";
  }
  config.oppositeShiftMode = val;
  if (!nosave) saveToLocalStorage();
}

export function setPageWidth(val, nosave) {
  if (val == null || val == undefined) {
    val = "100";
  }
  config.pageWidth = val;
  $("#centerContent").removeClass("wide125");
  $("#centerContent").removeClass("wide150");
  $("#centerContent").removeClass("wide200");
  $("#centerContent").removeClass("widemax");

  if (val !== "100") {
    $("#centerContent").addClass("wide" + val);
  }
  if (!nosave) saveToLocalStorage();
}

export function setCaretStyle(caretStyle, nosave) {
  if (caretStyle == null || caretStyle == undefined) {
    caretStyle = "default";
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
  if (!nosave) saveToLocalStorage();
}

export function setPaceCaretStyle(caretStyle, nosave) {
  if (caretStyle == null || caretStyle == undefined) {
    caretStyle = "default";
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
  if (!nosave) saveToLocalStorage();
}

export function setShowTimerProgress(timer, nosave) {
  if (timer == null || timer == undefined) {
    timer = false;
  }
  config.showTimerProgress = timer;
  if (config.showTimerProgress && TestLogic.active) {
    TimerProgress.show();
  } else {
    TimerProgress.hide();
  }
  if (!nosave) saveToLocalStorage();
}

export function toggleShowTimerProgress() {
  config.showTimerProgress = !config.showTimerProgress;
  if (config.showTimerProgress) {
    TimerProgress.show();
  } else {
    TimerProgress.hide();
  }
  saveToLocalStorage();
}

export function setShowLiveWpm(live, nosave) {
  if (live == null || live == undefined) {
    live = false;
  }
  config.showLiveWpm = live;
  if (live) {
    LiveWpm.show();
  } else {
    LiveWpm.hide();
  }
  ChallengeContoller.clearActive();
  if (!nosave) saveToLocalStorage();
}

export function toggleShowLiveWpm() {
  config.showLiveWpm = !config.showLiveWpm;
  if (config.showLiveWpm) {
    LiveWpm.show();
  } else {
    LiveWpm.hide();
  }
  saveToLocalStorage();
}

export function setShowLiveAcc(live, nosave) {
  if (live == null || live == undefined) {
    live = false;
  }
  config.showLiveAcc = live;
  if (live) {
    LiveAcc.show();
  } else {
    LiveAcc.hide();
  }
  if (!nosave) saveToLocalStorage();
}

export function toggleLiveAcc() {
  config.showLiveAcc = !config.showLiveAcc;
  if (config.showLiveAcc) {
    LiveAcc.show();
  } else {
    LiveAcc.hide();
  }
  saveToLocalStorage();
}

export function setShowLiveBurst(live, nosave) {
  if (live == null || live == undefined) {
    live = false;
  }
  config.showLiveBurst = live;
  if (live) {
    LiveBurst.show();
  } else {
    LiveAcc.hide();
  }
  if (!nosave) saveToLocalStorage();
}

export function toggleShowLiveBurst() {
  config.showLiveBurst = !config.showLiveBurst;
  if (config.showLiveBurst) {
    LiveBurst.show();
  } else {
    LiveBurst.hide();
  }
  saveToLocalStorage();
}

export function setHighlightMode(mode, nosave) {
  if (
    mode === "word" &&
    (config.funbox === "nospace" ||
      config.funbox === "read_ahead" ||
      config.funbox === "read_ahead_easy" ||
      config.funbox === "read_ahead_hard" ||
      config.funbox === "tts")
  ) {
    Notifications.add("Can't use word highlight with this funbox", 0);
    return;
  }
  if (mode == null || mode == undefined) {
    mode = "letter";
  }
  config.highlightMode = mode;
  // if(TestLogic.active){
  ChallengeContoller.clearActive();
  try {
    if (!nosave) TestUI.updateWordElement(config.blindMode);
  } catch {}
  // }
  if (!nosave) saveToLocalStorage();
}

export function setHideExtraLetters(val, nosave) {
  if (val == null || val == undefined) {
    val = false;
  }
  config.hideExtraLetters = val;
  if (!nosave) saveToLocalStorage();
}

export function toggleHideExtraLetters() {
  config.hideExtraLetters = !config.hideExtraLetters;
  saveToLocalStorage();
}

export function setTimerStyle(style, nosave) {
  if (style == null || style == undefined) {
    style = "mini";
  }
  config.timerStyle = style;
  TimerProgress.updateStyle();
  if (!nosave) saveToLocalStorage();
}

export function setTimerColor(color, nosave) {
  if (color == null || color == undefined) {
    color = "black";
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

  if (!nosave) saveToLocalStorage();
}
export function setTimerOpacity(opacity, nosave) {
  if (opacity == null || opacity == undefined) {
    opacity = 0.25;
  }
  config.timerOpacity = opacity;
  if (!nosave) saveToLocalStorage();
}

//key tips
export function setKeyTips(keyTips, nosave) {
  config.showKeyTips = keyTips;
  if (config.showKeyTips) {
    $("#bottom .keyTips").removeClass("hidden");
  } else {
    $("#bottom .keyTips").addClass("hidden");
  }
  if (!nosave) saveToLocalStorage();
}

export function toggleKeyTips() {
  config.showKeyTips = !config.showKeyTips;
  if (config.showKeyTips) {
    $("#bottom .keyTips").removeClass("hidden");
  } else {
    $("#bottom .keyTips").addClass("hidden");
  }
  saveToLocalStorage();
}

//mode
export function setTimeConfig(time, nosave) {
  if (time === null || isNaN(time) || time < 0) {
    time = 15;
  }
  time = parseInt(time);
  // if (!nosave) setMode("time", nosave);
  config.time = time;
  $("#top .config .time .text-button").removeClass("active");
  if (![15, 30, 60, 120].includes(time)) {
    time = "custom";
  }
  $("#top .config .time .text-button[timeConfig='" + time + "']").addClass(
    "active"
  );
  ChallengeContoller.clearActive();
  if (!nosave) saveToLocalStorage();
}

//quote length
export function setQuoteLength(len, nosave, multipleMode) {
  if (Array.isArray(len)) {
    //config load
    if (len.length === 1 && len[0] === -1) len = [1];
    config.quoteLength = len;
  } else {
    if (!Array.isArray(config.quoteLength)) config.quoteLength = [];
    if (len === null || isNaN(len) || len < -2 || len > 3) {
      len = 1;
    }
    len = parseInt(len);
    if (multipleMode) {
      if (!config.quoteLength.includes(len)) {
        config.quoteLength.push(len);
      } else {
        if (config.quoteLength.length > 1)
          config.quoteLength = config.quoteLength.filter((ql) => ql !== len);
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
  if (!nosave) saveToLocalStorage();
}

export function setWordCount(wordCount, nosave) {
  if (wordCount === null || isNaN(wordCount) || wordCount < 0) {
    wordCount = 10;
  }
  wordCount = parseInt(wordCount);
  // if (!nosave) setMode("words", nosave);
  config.words = wordCount;
  $("#top .config .wordCount .text-button").removeClass("active");
  if (![10, 25, 50, 100, 200].includes(wordCount)) {
    wordCount = "custom";
  }
  $(
    "#top .config .wordCount .text-button[wordCount='" + wordCount + "']"
  ).addClass("active");
  ChallengeContoller.clearActive();
  if (!nosave) saveToLocalStorage();
}

//caret
export function setSmoothCaret(mode, nosave) {
  config.smoothCaret = mode;
  if (!nosave) saveToLocalStorage();
  if (mode) {
    $("#caret").css("animation-name", "caretFlashSmooth");
  } else {
    $("#caret").css("animation-name", "caretFlashHard");
  }
}

export function toggleSmoothCaret() {
  config.smoothCaret = !config.smoothCaret;
  saveToLocalStorage();
  if (config.smoothCaret) {
    $("#caret").css("animation-name", "caretFlashSmooth");
  } else {
    $("#caret").css("animation-name", "caretFlashHard");
  }
}

//startgraphsatzero
export function toggleStartGraphsAtZero() {
  config.startGraphsAtZero = !config.startGraphsAtZero;
  saveToLocalStorage();
}

export function setStartGraphsAtZero(mode, nosave) {
  config.startGraphsAtZero = mode;
  if (!nosave) saveToLocalStorage();
}

//linescroll
export function setSmoothLineScroll(mode, nosave) {
  config.smoothLineScroll = mode;
  if (!nosave) saveToLocalStorage();
}

export function toggleSmoothLineScroll() {
  config.smoothLineScroll = !config.smoothLineScroll;
  saveToLocalStorage();
}

//quick tab
export function setQuickTabMode(mode, nosave) {
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
  if (!nosave) saveToLocalStorage();
}

export function toggleQuickTabMode() {
  config.quickTab = !config.quickTab;
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
  saveToLocalStorage();
}

export function previewFontFamily(font) {
  if (font == undefined) {
    font = "Roboto_Mono";
  }
  document.documentElement.style.setProperty(
    "--font",
    '"' + font.replace(/_/g, " ") + '"'
  );
}

//font family
export function setFontFamily(font, nosave) {
  if (font == undefined || font === "") {
    font = "Roboto_Mono";
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
    return;
  }
  config.fontFamily = font;
  document.documentElement.style.setProperty(
    "--font",
    `"${font.replace(/_/g, " ")}", "Roboto Mono"`
  );
  ChartController.setDefaultFontFamily(font);
  if (!nosave) saveToLocalStorage();
}

//freedom
export function setFreedomMode(freedom, nosave) {
  if (freedom == null) {
    freedom = false;
  }
  config.freedomMode = freedom;
  if (config.freedomMode && config.confidenceMode !== "off") {
    config.confidenceMode = "off";
  }
  if (!nosave) saveToLocalStorage();
}

export function toggleFreedomMode() {
  config.freedomMode = !config.freedomMode;
  if (config.freedomMode && config.confidenceMode !== "off") {
    config.confidenceMode = false;
  }
  saveToLocalStorage();
}

export function setConfidenceMode(cm, nosave) {
  if (cm == undefined) {
    cm = "off";
  }
  config.confidenceMode = cm;
  if (config.confidenceMode !== "off") {
    config.freedomMode = false;
    config.stopOnError = "off";
  }

  TestUI.updateModesNotice();
  if (!nosave) saveToLocalStorage();
}

export function toggleIndicateTypos() {
  let it = !config.indicateTypos;
  if (it == undefined) {
    it = false;
  }
  config.indicateTypos = it;
  saveToLocalStorage();
}

export function setIndicateTypos(it, nosave) {
  if (it == undefined) {
    it = false;
  }
  config.indicateTypos = it;
  if (!nosave) saveToLocalStorage();
}

export function setCustomTheme(boolean, nosave) {
  if (boolean !== undefined) config.customTheme = boolean;
  if (boolean) {
    ThemeController.set("custom");
  } else if (!boolean && !nosave) {
    ThemeController.set(config.theme);
  }
  if (!nosave) saveToLocalStorage();
}

export function setTheme(name, nosave) {
  config.theme = name;
  setCustomTheme(false, true, true);
  ThemeController.set(config.theme);
  if (!nosave) saveToLocalStorage();
}

export function setRandomTheme(val, nosave) {
  if (val === undefined || val === true || val === false) {
    val = "off";
  }
  if (val === "off") {
    ThemeController.clearRandom();
  }
  config.randomTheme = val;
  if (!nosave) saveToLocalStorage();
}

export function setBritishEnglish(val, nosave) {
  if (!val) {
    val = false;
  }
  config.britishEnglish = val;
  if (!nosave) saveToLocalStorage();
}

export function setLazyMode(val, nosave) {
  if (!val) {
    val = false;
  }
  config.lazyMode = val;
  if (!nosave) saveToLocalStorage();
}

export function toggleCustomTheme(nosave) {
  if (config.customTheme) {
    setCustomTheme(false);
    ThemeController.set(config.theme);
  } else {
    setCustomTheme(true);
    ThemeController.set("custom");
  }
  if (!nosave) saveToLocalStorage();
}

export function setCustomThemeColors(colors, nosave) {
  if (colors !== undefined) {
    config.customThemeColors = colors;
    // ThemeController.set("custom");
    // applyCustomThemeColors();
  }
  if (!nosave) saveToLocalStorage();
}

export function setLanguage(language, nosave) {
  if (language == null || language == undefined) {
    language = "english";
  }
  config.language = language;
  if (config.funbox === "tts") {
    TTS.setLanguage();
  }
  try {
    firebase.analytics().logEvent("changedLanguage", {
      language: language,
    });
  } catch (e) {
    console.log("Analytics unavailable");
  }
  if (!nosave) saveToLocalStorage();
}

export function toggleMonkey(nosave) {
  config.monkey = !config.monkey;
  if (config.monkey) {
    $("#monkey").removeClass("hidden");
  } else {
    $("#monkey").addClass("hidden");
  }
  if (!nosave) saveToLocalStorage();
}

export function setMonkey(monkey, nosave) {
  if (monkey === null || monkey === undefined) {
    monkey = false;
  }
  config.monkey = monkey;
  if (config.monkey) {
    $("#monkey").removeClass("hidden");
  } else {
    $("#monkey").addClass("hidden");
  }
  if (!nosave) saveToLocalStorage();
}

export function setKeymapMode(mode, nosave) {
  if (mode == null || mode == undefined) {
    mode = "off";
  }
  $(".active-key").removeClass("active-key");
  $(".keymap-key").attr("style", "");
  config.keymapMode = mode;
  ChallengeContoller.clearActive();
  if (!nosave) TestLogic.restart(false, nosave);
  if (!nosave) saveToLocalStorage();
}

export function setKeymapLegendStyle(style, nosave) {
  // Remove existing styles
  const keymapLegendStyles = ["lowercase", "uppercase", "blank"];
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
  if (!nosave) saveToLocalStorage();
}

export function setKeymapStyle(style, nosave) {
  $(".keymap").removeClass("matrix");
  $(".keymap").removeClass("split");
  $(".keymap").removeClass("split_matrix");
  style = style || "staggered";

  $(".keymap").addClass(style);
  config.keymapStyle = style;
  if (!nosave) saveToLocalStorage();
}

export function setKeymapLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  config.keymapLayout = layout;
  ChallengeContoller.clearActive();
  Keymap.refreshKeys(layout, setKeymapLayout);
  if (!nosave) saveToLocalStorage();
}

export function setLayout(layout, nosave) {
  if (layout == null || layout == undefined) {
    layout = "qwerty";
  }
  config.layout = layout;
  ChallengeContoller.clearActive();
  TestUI.updateModesNotice();
  if (config.keymapLayout === "overrideSync") {
    Keymap.refreshKeys(config.keymapLayout, setKeymapLayout);
  }
  if (!nosave) saveToLocalStorage();
}

// export function setSavedLayout(layout, nosave) {
//   if (layout == null || layout == undefined) {
//     layout = "qwerty";
//   }
//   config.savedLayout = layout;
//   setLayout(layout, nosave);
// }

export function setFontSize(fontSize, nosave) {
  if (fontSize == null || fontSize == undefined) {
    fontSize = 1;
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

  if (fontSize == 125) {
    $("#words").addClass("size125");
    $("#caret, #paceCaret").addClass("size125");
    $("#miniTimerAndLiveWpm").addClass("size125");
  } else if (fontSize == 15) {
    $("#words").addClass("size15");
    $("#caret, #paceCaret").addClass("size15");
    $("#miniTimerAndLiveWpm").addClass("size15");
  } else if (fontSize == 2) {
    $("#words").addClass("size2");
    $("#caret, #paceCaret").addClass("size2");
    $("#miniTimerAndLiveWpm").addClass("size2");
  } else if (fontSize == 3) {
    $("#words").addClass("size3");
    $("#caret, #paceCaret").addClass("size3");
    $("#miniTimerAndLiveWpm").addClass("size3");
  } else if (fontSize == 35) {
    $("#words").addClass("size34");
    $("#caret, #paceCaret").addClass("size35");
    $("#miniTimerAndLiveWpm").addClass("size35");
  } else if (fontSize == 4) {
    $("#words").addClass("size4");
    $("#caret, #paceCaret").addClass("size4");
    $("#miniTimerAndLiveWpm").addClass("size4");
  }
  if (!nosave) saveToLocalStorage();
}

export function setCustomBackground(value, nosave) {
  if (value == null || value == undefined) {
    value = "";
  }
  value = value.trim();
  if (
    (/(https|http):\/\/(www\.|).+\..+\/.+(\.png|\.gif|\.jpeg|\.jpg)/gi.test(
      value
    ) &&
      !/[<>]/.test(value)) ||
    value == ""
  ) {
    config.customBackground = value;
    CommandlineLists.defaultCommands.list.filter(
      (command) => command.id == "changeCustomBackground"
    )[0].defaultValue = value;
    ThemeController.applyCustomBackground();
    if (!nosave) saveToLocalStorage();
  } else {
    Notifications.add("Invalid custom background URL", 0);
  }
}

export function setCustomLayoutfluid(value, nosave) {
  if (value == null || value == undefined) {
    value = "qwerty#dvorak#colemak";
  }
  value = value.replace(/ /g, "#");

  //validate the layouts
  let allGood = true;
  let list = Object.keys(LayoutList);
  value.split("#").forEach((customLayout) => {
    if (!list.includes(customLayout)) allGood = false;
  });
  if (!allGood) {
    Notifications.add(
      "One of the layouts was not found. Make sure the name matches exactly. Reverting to default",
      0,
      4
    );
    value = "qwerty#dvorak#colemak";
    nosave = false;
  }
  config.customLayoutfluid = value;
  CommandlineLists.defaultCommands.list.filter(
    (command) => command.id == "changeCustomLayoutfluid"
  )[0].defaultValue = value.replace(/#/g, " ");
  $(".pageSettings .section.customLayoutfluid input").val(
    value.replace(/#/g, " ")
  );
  if (!nosave) saveToLocalStorage();
}

export function setCustomBackgroundSize(value, nosave) {
  if (value != "cover" && value != "contain" && value != "max") {
    value = "cover";
  }
  config.customBackgroundSize = value;
  ThemeController.applyCustomBackgroundSize();
  if (!nosave) saveToLocalStorage();
}

export function setCustomBackgroundFilter(array, nosave) {
  config.customBackgroundFilter = array;
  BackgroundFilter.loadConfig(config.customBackgroundFilter);
  BackgroundFilter.apply();
  if (!nosave) saveToLocalStorage();
}

export function setMonkeyPowerLevel(level, nosave) {
  if (!["off", "1", "2", "3", "4"].includes(level)) level = "off";
  config.monkeyPowerLevel = level;
  if (!nosave) saveToLocalStorage();
}

export function setBurstHeatmap(value, nosave) {
  if (!value) {
    value = false;
  }
  config.burstHeatmap = value;
  if (!nosave) {
    TestUI.applyBurstHeatmap();
    saveToLocalStorage();
  }
}

export function apply(configObj) {
  if (configObj == null || configObj == undefined) {
    Notifications.add("Could not apply config", -1, 3);
    return;
  }
  Object.keys(defaultConfig).forEach((configKey) => {
    if (configObj[configKey] === undefined) {
      configObj[configKey] = defaultConfig[configKey];
    }
  });
  if (configObj && configObj != null && configObj != "null") {
    setTheme(configObj.theme, true);
    setCustomThemeColors(configObj.customThemeColors, true);
    setCustomTheme(configObj.customTheme, true, true);
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
    // setSavedLayout(configObj.savedLayout, true);
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
    setPlaySoundOnError(configObj.playSoundOnError, true);
    setPlaySoundOnClick(configObj.playSoundOnClick, true);
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

    LanguagePicker.setActiveGroup();

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
      Notifications.add("Error initialising ads: " + e.message);
      console.log("error initialising ads " + e.message);
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
  }
  TestUI.updateModesNotice();
}

export function reset() {
  apply(defaultConfig);
  saveToLocalStorage();
}

export function loadFromLocalStorage() {
  console.log("loading localStorage config");
  // let newConfig = $.cookie("config");
  let newConfig = window.localStorage.getItem("config");
  if (newConfig !== undefined && newConfig !== null && newConfig !== "") {
    try {
      newConfig = JSON.parse(newConfig);
    } catch (e) {
      newConfig = {};
    }
    apply(newConfig);
    console.log("applying localStorage config");
    localStorageConfig = newConfig;
    saveToLocalStorage(true);
    console.log("saving localStorage config");
  }
  // TestLogic.restart(false, true);
  loadDone();
}

export function getConfigChanges() {
  let configChanges = {};
  Object.keys(config)
    .filter((key) => {
      return config[key] != defaultConfig[key];
    })
    .forEach((key) => {
      configChanges[key] = config[key];
    });
  return configChanges;
}

export function setConfig(newConfig) {
  config = newConfig;
}

export let loadPromise = new Promise((v) => {
  loadDone = v;
});

export default config;
