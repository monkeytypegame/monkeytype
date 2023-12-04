import _ from "lodash";
import joi from "joi";

const CARET_STYLES = [
  "off",
  "default",
  "underline",
  "outline",
  "block",
  "carrot",
  "banana",
];

const CONFIG_SCHEMA = joi.object({
  theme: joi.string().max(50).token(),
  themeLight: joi.string().max(50).token(),
  themeDark: joi.string().max(50).token(),
  autoSwitchTheme: joi.boolean(),
  customTheme: joi.boolean(),
  customThemeId: joi.string().min(0).max(24).token(),
  customThemeColors: joi
    .array()
    .items(joi.string().pattern(/^#([\da-f]{3}){1,2}$/i))
    .length(10),
  favThemes: joi.array().items(joi.string().max(50).token()),
  showKeyTips: joi.boolean(),
  showLiveWpm: joi.boolean(),
  showTimerProgress: joi.boolean(),
  smoothCaret: joi.string().valid("off", "slow", "medium", "fast"),
  quickRestart: joi.string().valid("off", "tab", "esc", "enter"),
  punctuation: joi.boolean(),
  numbers: joi.boolean(),
  words: joi.number().min(0),
  time: joi.number().min(0),
  mode: joi.string().valid("time", "words", "quote", "zen", "custom"),
  quoteLength: joi.array().items(joi.number()),
  language: joi
    .string()
    .max(50)
    .pattern(/^[a-zA-Z0-9_+]+$/),
  fontSize: joi.number().min(0),
  freedomMode: joi.boolean(),
  difficulty: joi.string().valid("normal", "expert", "master"),
  blindMode: joi.boolean(),
  quickEnd: joi.boolean(),
  caretStyle: joi.string().valid(...CARET_STYLES),
  paceCaretStyle: joi.string().valid(...CARET_STYLES),
  flipTestColors: joi.boolean(),
  layout: joi.string().max(50).token(),
  funbox: joi
    .string()
    .max(100)
    .regex(/[\w#]+/),
  confidenceMode: joi.string().valid("off", "on", "max"),
  indicateTypos: joi.string().valid("off", "below", "replace"),
  timerStyle: joi.string().valid("bar", "text", "mini"),
  colorfulMode: joi.boolean(),
  randomTheme: joi
    .string()
    .valid("off", "on", "fav", "light", "dark", "custom"),
  timerColor: joi.string().valid("black", "sub", "text", "main"),
  timerOpacity: joi.number().valid(0.25, 0.5, 0.75, 1),
  stopOnError: joi.string().valid("off", "word", "letter"),
  showAllLines: joi.boolean(),
  keymapMode: joi.string().valid("off", "static", "react", "next"),
  keymapStyle: joi
    .string()
    .valid(
      "staggered",
      "alice",
      "matrix",
      "split",
      "split_matrix",
      "steno",
      "steno_matrix"
    ),
  keymapLegendStyle: joi
    .string()
    .valid("lowercase", "uppercase", "blank", "dynamic"),
  keymapLayout: joi.string().valid().max(50).token(),
  keymapShowTopRow: joi.string().valid("always", "layout", "never"),
  fontFamily: joi
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9_\-+.]+$/),
  smoothLineScroll: joi.boolean(),
  alwaysShowDecimalPlaces: joi.boolean(),
  alwaysShowWordsHistory: joi.boolean(),
  singleListCommandLine: joi.string().valid("manual", "on"),
  capsLockWarning: joi.boolean(),
  playSoundOnError: joi.string().valid("off", ..._.range(1, 4).map(_.toString)),
  playSoundOnClick: joi.alternatives().try(
    joi.boolean(), //todo remove soon
    joi.string().valid("off", ..._.range(1, 14).map(_.toString))
  ),
  soundVolume: joi.number().min(0).max(1),
  startGraphsAtZero: joi.boolean(),
  showOutOfFocusWarning: joi.boolean(),
  paceCaret: joi
    .string()
    .valid("off", "average", "pb", "last", "daily", "custom"),
  paceCaretCustomSpeed: joi.number().min(0),
  repeatedPace: joi.boolean(),
  pageWidth: joi.string().valid("100", "125", "150", "200", "max"),
  accountChart: joi
    .array()
    .items(joi.string().valid("on", "off"))
    .min(3)
    .max(4)
    .optional(), //replace min max with length 4 after a while
  minWpm: joi.string().valid("off", "custom"),
  minWpmCustomSpeed: joi.number().min(0),
  highlightMode: joi
    .string()
    .valid(
      "off",
      "letter",
      "word",
      "next_word",
      "next_two_words",
      "next_three_words"
    ),
  tapeMode: joi.string().valid("off", "letter", "word"),
  typingSpeedUnit: joi.string().valid("wpm", "cpm", "wps", "cps", "wph"),
  enableAds: joi.string().valid("off", "on", "max"),
  ads: joi.string().valid("off", "result", "on", "sellout"),
  hideExtraLetters: joi.boolean(),
  strictSpace: joi.boolean(),
  minAcc: joi.string().valid("off", "custom"),
  minAccCustom: joi.number().min(0),
  showLiveAcc: joi.boolean(),
  showLiveBurst: joi.boolean(),
  monkey: joi.boolean(),
  repeatQuotes: joi.string().valid("off", "typing"),
  oppositeShiftMode: joi.string().valid("off", "on", "keymap"),
  customBackground: joi.string().uri().allow(""),
  customBackgroundSize: joi.string().valid("cover", "contain", "max"),
  customBackgroundFilter: joi.array().items(joi.number()),
  customLayoutfluid: joi.string().regex(/^[0-9a-zA-Z_#]+$/),
  monkeyPowerLevel: joi.string().valid("off", "1", "2", "3", "4"),
  minBurst: joi.string().valid("off", "fixed", "flex"),
  minBurstCustomSpeed: joi.number().min(0),
  burstHeatmap: joi.boolean(),
  britishEnglish: joi.boolean(),
  lazyMode: joi.boolean(),
  showAverage: joi.string().valid("off", "speed", "acc", "both"),
});

export default CONFIG_SCHEMA;
