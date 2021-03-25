import Config, { reset as resetConfig } from "./config";

export let defaultConfig = {
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
  capsLockBackspace: false,
  layout: "default",
  savedLayout: "default",
  confidenceMode: "off",
  indicateTypos: false,
  timerStyle: "text",
  colorfulMode: false,
  randomTheme: "off",
  timerColor: "black",
  timerOpacity: "0.25",
  stopOnError: "off",
  showAllLines: false,
  keymapMode: "off",
  keymapStyle: "staggered",
  keymapLayout: "qwerty",
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
  monkey: false,
  repeatQuotes: "off",
  oppositeShiftMode: "off",
};

export function reset() {
  resetConfig();
}

export function theme(val) {
  Config.theme = val;
}
export function customTheme(val) {
  Config.customTheme = val;
}
export function customThemeColors(val) {
  Config.customThemeColors = val;
}
export function favThemes(val) {
  Config.favThemes = val;
}
export function showKeyTips(val) {
  Config.showKeyTips = val;
}
export function showLiveWpm(val) {
  Config.showLiveWpm = val;
}
export function showTimerProgress(val) {
  Config.showTimerProgress = val;
}
export function smoothCaret(val) {
  Config.smoothCaret = val;
}
export function quickTab(val) {
  Config.quickTab = val;
}
export function punctuation(val) {
  Config.punctuation = val;
}
export function numbers(val) {
  Config.numbers = val;
}
export function words(val) {
  Config.words = val;
}
export function time(val) {
  Config.time = val;
}
export function mode(val) {
  Config.mode = val;
}
export function quoteLength(val) {
  Config.quoteLength = val;
}
export function language(val) {
  Config.language = val;
}
export function fontSize(val) {
  Config.fontSize = val;
}
export function freedomMode(val) {
  Config.freedomMode = val;
}
export function resultFilters(val) {
  Config.resultFilters = val;
}
export function difficulty(val) {
  Config.difficulty = val;
}
export function blindMode(val) {
  Config.blindMode = val;
}
export function quickEnd(val) {
  Config.quickEnd = val;
}
export function caretStyle(val) {
  Config.caretStyle = val;
}
export function paceCaretStyle(val) {
  Config.paceCaretStyle = val;
}
export function flipTestColors(val) {
  Config.flipTestColors = val;
}
export function capsLockBackspace(val) {
  Config.capsLockBackspace = val;
}
export function layout(val) {
  Config.layout = val;
}
export function savedLayout(val) {
  Config.savedLayout = val;
}
export function confidenceMode(val) {
  Config.confidenceMode = val;
}
export function indicateTypos(val) {
  Config.indicateTypos = val;
}
export function timerStyle(val) {
  Config.timerStyle = val;
}
export function colorfulMode(val) {
  Config.colorfulMode = val;
}
export function randomTheme(val) {
  Config.randomTheme = val;
}
export function timerColor(val) {
  Config.timerColor = val;
}
export function timerOpacity(val) {
  Config.timerOpacity = val;
}
export function stopOnError(val) {
  Config.stopOnError = val;
}
export function showAllLines(val) {
  Config.showAllLines = val;
}
export function keymapMode(val) {
  Config.keymapMode = val;
}
export function keymapStyle(val) {
  Config.keymapStyle = val;
}
export function keymapLayout(val) {
  Config.keymapLayout = val;
}
export function fontFamily(val) {
  Config.fontFamily = val;
}
export function smoothLineScroll(val) {
  Config.smoothLineScroll = val;
}
export function alwaysShowDecimalPlaces(val) {
  Config.alwaysShowDecimalPlaces = val;
}
export function alwaysShowWordsHistory(val) {
  Config.alwaysShowWordsHistory = val;
}
export function singleListCommandLine(val) {
  Config.singleListCommandLine = val;
}
export function playSoundOnError(val) {
  Config.playSoundOnError = val;
}
export function playSoundOnClick(val) {
  Config.playSoundOnClick = val;
}
export function startGraphsAtZero(val) {
  Config.startGraphsAtZero = val;
}
export function swapEscAndTab(val) {
  Config.swapEscAndTab = val;
}
export function showOutOfFocusWarning(val) {
  Config.showOutOfFocusWarning = val;
}
export function paceCaret(val) {
  Config.paceCaret = val;
}
export function paceCaretCustomSpeed(val) {
  Config.paceCaretCustomSpeed = val;
}
export function pageWidth(val) {
  Config.pageWidth = val;
}
export function chartAccuracy(val) {
  Config.chartAccuracy = val;
}
export function chartStyle(val) {
  Config.chartStyle = val;
}
export function minWpm(val) {
  Config.minWpm = val;
}
export function minWpmCustomSpeed(val) {
  Config.minWpmCustomSpeed = val;
}
export function highlightMode(val) {
  Config.highlightMode = val;
}
export function alwaysShowCPM(val) {
  Config.alwaysShowCPM = val;
}
export function enableAds(val) {
  Config.enableAds = val;
}
export function hideExtraLetters(val) {
  Config.hideExtraLetters = val;
}
export function strictSpace(val) {
  Config.strictSpace = val;
}
export function minAcc(val) {
  Config.minAcc = val;
}
export function minAccCustom(val) {
  Config.minAccCustom = val;
}
export function showLiveAcc(val) {
  Config.showLiveAcc = val;
}
export function monkey(val) {
  Config.monkey = val;
}
export function repeatQuotes(val) {
  Config.repeatQuotes = val;
}
export function oppositeShiftMode(val) {
  Config.oppositeShiftMode = val;
}
