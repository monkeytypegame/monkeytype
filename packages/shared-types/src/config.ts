import { PersonalBests } from "./user";

export type SmoothCaret = "off" | "slow" | "medium" | "fast";
export type QuickRestart = "off" | "esc" | "tab" | "enter";
export type QuoteLength = -3 | -2 | -1 | 0 | 1 | 2 | 3;
export type CaretStyle =
  | "off"
  | "default"
  | "block"
  | "outline"
  | "underline"
  | "carrot"
  | "banana";
export type Difficulty = "normal" | "expert" | "master";
export type Mode = "time" | "words" | "quote" | "custom" | "zen";
export type Mode2<M extends Mode> = M extends M
  ? keyof PersonalBests[M]
  : never;
export type Mode2Custom<M extends Mode> = Mode2<M> | "custom";
export type ConfidenceMode = "off" | "on" | "max";
export type IndicateTypos = "off" | "below" | "replace";
export type TimerStyle = "off" | "bar" | "text" | "mini";
export type LiveSpeedAccBurstStyle = "off" | "text" | "mini";
export type RandomTheme = "off" | "on" | "fav" | "light" | "dark" | "custom";
export type TimerColor = "black" | "sub" | "text" | "main";
export type TimerOpacity = "0.25" | "0.5" | "0.75" | "1";
export type StopOnError = "off" | "word" | "letter";
export type KeymapMode = "off" | "static" | "react" | "next";
export type KeymapStyle =
  | "staggered"
  | "alice"
  | "matrix"
  | "split"
  | "split_matrix"
  | "steno"
  | "steno_matrix";
export type KeymapLegendStyle = "lowercase" | "uppercase" | "blank" | "dynamic";
export type KeymapShowTopRow = "always" | "layout" | "never";
export type SingleListCommandLine = "manual" | "on";
export type PlaySoundOnClick =
  | "off"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15";
export type PlaySoundOnError = "off" | "1" | "2" | "3" | "4";
export type SoundVolume = "0.1" | "0.5" | "1.0";
export type PaceCaret = "off" | "average" | "pb" | "last" | "custom" | "daily";
export type AccountChart = [
  "off" | "on",
  "off" | "on",
  "off" | "on",
  "off" | "on"
];
export type MinimumWordsPerMinute = "off" | "custom";
export type HighlightMode =
  | "off"
  | "letter"
  | "word"
  | "next_word"
  | "next_two_words"
  | "next_three_words";
export type TypingSpeedUnit = "wpm" | "cpm" | "wps" | "cps" | "wph";
export type Ads = "off" | "result" | "on" | "sellout";
export type MinimumAccuracy = "off" | "custom";
export type RepeatQuotes = "off" | "typing";
export type OppositeShiftMode = "off" | "on" | "keymap";
export type CustomBackgroundSize = "cover" | "contain" | "max";
export type CustomBackgroundFilter = [number, number, number, number, number];
export type CustomLayoutFluid = `${string}#${string}#${string}`;
export type MonkeyPowerLevel = "off" | "1" | "2" | "3" | "4";
export type MinimumBurst = "off" | "fixed" | "flex";
export type ShowAverage = "off" | "speed" | "acc" | "both";
export type TapeMode = "off" | "letter" | "word";

export type Config = {
  theme: string;
  themeLight: string;
  themeDark: string;
  autoSwitchTheme: boolean;
  customTheme: boolean;
  customThemeColors: string[];
  favThemes: string[];
  showKeyTips: boolean;
  smoothCaret: SmoothCaret;
  quickRestart: QuickRestart;
  punctuation: boolean;
  numbers: boolean;
  words: number;
  time: number;
  mode: Mode;
  quoteLength: QuoteLength[];
  language: string;
  fontSize: number;
  freedomMode: boolean;
  difficulty: Difficulty;
  blindMode: boolean;
  quickEnd: boolean;
  caretStyle: CaretStyle;
  paceCaretStyle: CaretStyle;
  flipTestColors: boolean;
  layout: string;
  funbox: string;
  confidenceMode: ConfidenceMode;
  indicateTypos: IndicateTypos;
  timerStyle: TimerStyle;
  liveSpeedStyle: LiveSpeedAccBurstStyle;
  liveAccStyle: LiveSpeedAccBurstStyle;
  liveBurstStyle: LiveSpeedAccBurstStyle;
  colorfulMode: boolean;
  randomTheme: RandomTheme;
  timerColor: TimerColor;
  timerOpacity: TimerOpacity;
  stopOnError: StopOnError;
  showAllLines: boolean;
  keymapMode: KeymapMode;
  keymapStyle: KeymapStyle;
  keymapLegendStyle: KeymapLegendStyle;
  keymapLayout: string;
  keymapShowTopRow: KeymapShowTopRow;
  keymapScale: number;
  fontFamily: string;
  smoothLineScroll: boolean;
  alwaysShowDecimalPlaces: boolean;
  alwaysShowWordsHistory: boolean;
  singleListCommandLine: SingleListCommandLine;
  capsLockWarning: boolean;
  playSoundOnError: PlaySoundOnError;
  playSoundOnClick: PlaySoundOnClick;
  soundVolume: SoundVolume;
  startGraphsAtZero: boolean;
  showOutOfFocusWarning: boolean;
  paceCaret: PaceCaret;
  paceCaretCustomSpeed: number;
  repeatedPace: boolean;
  accountChart: AccountChart;
  minWpm: MinimumWordsPerMinute;
  minWpmCustomSpeed: number;
  highlightMode: HighlightMode;
  typingSpeedUnit: TypingSpeedUnit;
  ads: Ads;
  hideExtraLetters: boolean;
  strictSpace: boolean;
  minAcc: MinimumAccuracy;
  minAccCustom: number;
  monkey: boolean;
  repeatQuotes: RepeatQuotes;
  oppositeShiftMode: OppositeShiftMode;
  customBackground: string;
  customBackgroundSize: CustomBackgroundSize;
  customBackgroundFilter: CustomBackgroundFilter;
  customLayoutfluid: CustomLayoutFluid;
  monkeyPowerLevel: MonkeyPowerLevel;
  minBurst: MinimumBurst;
  minBurstCustomSpeed: number;
  burstHeatmap: boolean;
  britishEnglish: boolean;
  lazyMode: boolean;
  showAverage: ShowAverage;
  tapeMode: TapeMode;
  maxLineWidth: number;
};

export type ConfigValue = Config[keyof Config];
