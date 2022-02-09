import { Language, LanguageGroup } from "./Language";

import { Layout } from "./Layout";

import { Theme } from "./Theme";

import { Funbox, FunboxJSON, FunboxJSONType } from "./Funbox";

import { FontFamily } from "./Font";

export declare type Difficulty = "normal" | "expert" | "master";

export declare type Mode = "time" | "words" | "quote" | "custom";

export declare type WordsModes = 10 | 25 | 50 | 100;

export declare type TimeModes = 15 | 30 | 60 | 120;

export declare type CustomModes = "custom";

export declare type QuoteModes = "short" | "medium" | "long" | "thicc";

export declare type QuoteLength = (0 | 1 | 2 | 3)[];

export declare type FontSize = 1 | 1.25 | 1.5 | 2 | 3 | 4;

export declare type CaretStyle =
  | "off"
  | "default"
  | "block"
  | "outline"
  | "underline"
  | "carrot"
  | "banana";

export declare type ConfidenceMode = "off" | "on" | "max";

export declare type TimerStyle = "bar" | "text" | "mini";

export declare type RandomTheme = "off" | "on" | "favorite" | "light" | "dark";

export declare type TimerColor = "black" | "sub" | "text" | "main";

export declare type TimerOpacity = "0.25" | "0.5" | "0.75" | "1";

export declare type StopOnError = "off" | "word" | "letter";

export declare type KeymapMode = "off" | "static" | "react" | "next";

export declare type KeymapStyle =
  | "staggered"
  | "alice"
  | "matrix"
  | "split"
  | "split_matrix";

export declare type KeymapLegendStyle = "lowercase" | "uppercase" | "blank";

export declare type SingleListCommandLine = "manual" | "on";

export declare type PlaySoundOnClick =
  | "off"
  | "click"
  | "beep"
  | "pop"
  | "nk_creams"
  | "typewriter"
  | "osu"
  | "hitmarker";

export declare type SoundVolume = "0.1" | "0.5" | "1.0";

export declare type PaceCaret = "off" | "average" | "pb" | "custom";

export declare type PageWidth = "100" | "125" | "150" | "200" | "max";

export declare type ChartStyle = "line" | "scatter";

export declare type MinimumWordsPerMinute = "off" | "custom";

export declare type HighlightMode = "off" | "letter" | "word";

export declare type EnableAds = "off" | "on" | "sellout";

export declare type MinimumAccuracy = "off" | "custom";

export declare type RepeatQuotes = "off" | "typing";

export declare type OppositeShiftMode = "off" | "on" | "keymap";

export declare type CustomBackgroundSize = "cover" | "contain" | "max";

export declare type CustomBackgroundFilter = [
  0 | 1,
  0 | 1,
  0 | 1,
  0 | 1,
  0 | 1
];

export declare type MonkeyPowerLevel =
  | "off"
  | "mellow"
  | "high"
  | "ultra"
  | "over_9000";

export declare type MinBurst = "off" | "fixed" | "flex";

export declare interface Preset {
  _id: string;
  name: string;
  config: Config;
}

export declare interface PersonalBest {
  acc: number;
  consistency: number;
  difficulty: Difficulty;
  lazyMode: boolean;
  language: Language;
  punctuation: boolean;
  raw: number;
  wpm: number;
  timestamp: number;
}

export declare interface PersonalBests {
  time: {
    15: PersonalBest[];
    30: PersonalBest[];
    60: PersonalBest[];
    120: PersonalBest[];
  };
  words: {
    10: PersonalBest[];
    25: PersonalBest[];
    50: PersonalBest[];
    100: PersonalBest[];
  };
  quote: { [quote: string]: PersonalBest[] };
  custom: { custom: PersonalBest[] };
}

export declare interface Tag {
  _id: string;
  name: string;
  personalBests: PersonalBests;
  active: boolean;
}

export declare interface Stats {
  time: number;
  started: number;
  completed: number;
}

export declare interface ChartData {
  wpm: number[];
  raw: number[];
  err: number[];
}

export declare interface KeyStats {
  average: number;
  sd: number;
};

export declare interface Result {
  _id: string;
  wpm: number;
  rawWpm: number;
  charStats: number[];
  acc: number;
  mode: Mode;
  mode2: WordsModes | TimeModes;
  quoteLength: number;
  timestamp: number;
  restartCount: number;
  incompleteTestSeconds: number;
  testDuration: number;
  afkDuration: number;
  tags: Tag[];
  consistency: number;
  keyConsistency: number;
  chartData: ChartData;
  uid: string;
  keySpacingStats: KeyStats;
  keyDurationStats: KeyStats;
  isPb: boolean;
  bailedOut?: boolean;
  blindMode?: boolean;
  lazyMode?: boolean;
  difficulty?: Difficulty;
  funbox?: Funbox;
  language?: Language | null;
  numbers?: boolean;
  punctuation?: boolean;
}

export declare interface Config {
  theme: Theme;
  customTheme: boolean;
  customThemeColors: string[];
  favThemes: Theme[];
  showKeyTips: boolean;
  showLiveWpm: boolean;
  showTimerProgress: boolean;
  smoothCaret: boolean;
  quickTab: boolean;
  punctuation: boolean;
  numbers: boolean;
  words: WordsModes;
  time: TimeModes;
  mode: Mode;
  quoteLength: QuoteLength;
  language: Language;
  fontSize: FontSize;
  freedomMode: boolean;
  difficulty: Difficulty;
  blindMode: boolean;
  quickEnd: boolean;
  caretStyle: CaretStyle;
  paceCaretStyle: CaretStyle;
  flipTestColors: boolean;
  layout: Layout;
  funbox: Funbox;
  confidenceMode: ConfidenceMode;
  indicateTypos: boolean;
  timerStyle: TimerStyle;
  colorfulMode: boolean;
  randomTheme: RandomTheme;
  timerColor: TimerColor;
  timerOpacity: TimerOpacity;
  stopOnError: StopOnError;
  showAllLines: boolean;
  keymapMode: KeymapMode;
  keymapStyle: KeymapStyle;
  keymapLegendStyle: KeymapLegendStyle;
  keymapLayout: Layout;
  fontFamily: FontFamily;
  smoothLineScroll: boolean;
  alwaysShowDecimalPlaces: boolean;
  alwaysShowWordsHistory: boolean;
  singleListCommandLine: SingleListCommandLine;
  capsLockWarning: boolean;
  playSoundOnError: boolean;
  playSoundOnClick: PlaySoundOnClick;
  soundVolume: SoundVolume;
  startGraphsAtZero: boolean;
  swapEscAndTab: boolean;
  showOutOfFocusWarning: boolean;
  paceCaret: PaceCaret;
  paceCaretCustomSpeed: number;
  repeatedPace: boolean;
  pageWidth: PageWidth;
  chartAccuracy: boolean;
  chartStyle: ChartStyle;
  minWpm: MinimumWordsPerMinute;
  minWpmCustomSpeed: number;
  highlightMode: HighlightMode;
  alwaysShowCPM: boolean;
  enableAds: EnableAds;
  hideExtraLetters: boolean;
  strictSpace: boolean;
  minAcc: MinimumAccuracy;
  minAccCustom: number;
  showLiveAcc: boolean;
  showLiveBurst: boolean;
  monkey: boolean;
  repeatQuotes: RepeatQuotes;
  oppositeShiftMode: OppositeShiftMode;
  customBackground: string;
  customBackgroundSize: CustomBackgroundSize;
  customBackgroundFilter: CustomBackgroundFilter;
  customLayoutfluid: string;
  monkeyPowerLevel: MonkeyPowerLevel;
  minBurst: MinBurst;
  minBurstCustomSpeed: number;
  burstHeatmap: boolean;
  britishEnglish: boolean;
  lazyMode: boolean;
}

// TODO find structure of Leaderboard
export declare interface Leaderboard {
  [key: string]: any;
}

export declare interface Snapshot {
  banned?: boolean;
  emailVerified?: boolean;
  quoteRatings?: object; // TODO find structure of quoteRatings
  results?: Result[];
  verified?: boolean;
  personalBests: PersonalBests;
  name?: string;
  presets: Preset[];
  tags: Tag[];
  favouriteThemes: Theme[];
  lbMemory?: Leaderboard;
  globalStats: Stats;
  quoteMod: boolean;
  discordId?: string;
  config?: Config;
}

export declare interface ResultFilters {
  difficulty: {
    normal?: boolean;
    expert?: boolean;
    master?: boolean;
    all?: boolean;
    array?: (keyof ResultFilters["difficulty"])[];
  };
  mode: {
    words?: boolean;
    time?: boolean;
    quote?: boolean;
    zen?: boolean;
    custom?: boolean;
    all?: boolean;
    array?: (keyof ResultFilters["mode"])[];
  };
  words: {
    10?: boolean;
    25?: boolean;
    50?: boolean;
    100?: boolean;
    200?: boolean;
    custom?: boolean;
    all?: boolean;
    array?: (keyof ResultFilters["words"])[];
  };
  time: {
    15?: boolean;
    30?: boolean;
    60?: boolean;
    120?: boolean;
    custom?: boolean;
    all?: boolean;
    array?: (keyof ResultFilters["time"])[];
  };
  quoteLength: {
    short?: boolean;
    medium?: boolean;
    long?: boolean;
    thicc?: boolean;
    all?: boolean;
    array?: (keyof ResultFilters["quoteLength"])[];
  };
  punctuation: {
    on?: boolean;
    off?: boolean;
    all?: boolean;
    array?: (keyof ResultFilters["punctuation"])[];
  };
  numbers: {
    on?: boolean;
    off?: boolean;
    all?: boolean;
    array?: (keyof ResultFilters["numbers"])[];
  };
  date: {
    last_day?: boolean;
    last_week?: boolean;
    last_month?: boolean;
    last_3months?: boolean;
    all?: boolean;
    array?: (keyof ResultFilters["date"])[];
    [date: string]: boolean | any[] | undefined;
  };
  tags: {
    none?: boolean;
    all?: boolean;
    array?: (keyof ResultFilters["tags"])[];
    [tag: string]: boolean | any[] | undefined;
  };
  language: {
    all?: boolean;
    array?: (keyof ResultFilters["language"])[];
    [language: string]: boolean | any[] | undefined;
  };
  funbox: {
    none?: boolean;
    all?: boolean;
    array?: (keyof ResultFilters["funbox"])[];
    [funbox: string]: boolean | any[] | undefined;
  };
}

export declare type Group = keyof ResultFilters;

export declare type Filter<G extends Group> = keyof ResultFilters[G];

export declare interface TimerStats {
  dateNow: number;
  now: number;
  expected: number;
  nextDelay: number;
}

export declare interface GithubRelease {
  url: string,
  assets_url: string,
  upload_url: string,
  html_url: string,
  id: number,
  author: {
    login: string,
    id: number,
    node_id: string,
    avatar_url: string,
    gravatar_id: string,
    url: string,
    html_url: string,
    followers_url: string,
    following_url: string,
    gists_url: string,
    starred_url: string,
    subscriptions_url: string,
    organizations_url: string,
    repos_url: string,
    events_url: string,
    received_events_url: string,
    type: string,
    site_admin: boolean
  },
  node_id: string,
  tag_name: string,
  target_commitish: string,
  name: string,
  draft: boolean,
  prerelease: boolean,
  created_at: string,
  published_at: string,
  assets: any[],
  tarball_url: string,
  zipball_url: string,
  body: string,
  reactions: {
    url: string,
    total_count: number,
    [reaction: string]: number | string
  }
}
