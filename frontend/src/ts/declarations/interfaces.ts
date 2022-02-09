export declare type Language =
  | "english"
  | "english_1k"
  | "english_5k"
  | "english_10k"
  | "english_25k"
  | "english_450k"
  | "english_commonly_misspelled"
  | "spanish"
  | "spanish_1k"
  | "spanish_10k"
  | "french"
  | "french_1k"
  | "french_2k"
  | "french_10k"
  | "arabic"
  | "arabic_10k"
  | "malagasy"
  | "malagasy_1k"
  | "malay"
  | "mongolian"
  | "mongolian_10k"
  | "russian"
  | "russian_1k"
  | "russian_10k"
  | "ukrainian"
  | "ukrainian_1k"
  | "ukrainian_10k"
  | "ukrainian_50k"
  | "portuguese"
  | "portuguese_3k"
  | "indonesian"
  | "indonesian_1k"
  | "german"
  | "german_1k"
  | "german_10k"
  | "german_250k"
  | "swiss_german"
  | "swiss_german_1k"
  | "georgian"
  | "tamil"
  | "greek"
  | "turkish"
  | "irish"
  | "italian"
  | "italian_1k"
  | "italian_7k"
  | "italian_60k"
  | "italian_280k"
  | "thai"
  | "polish"
  | "polish_2k"
  | "polish_200k"
  | "czech"
  | "czech_1k"
  | "czech_10k"
  | "slovak"
  | "slovak_1k"
  | "slovak_10k"
  | "slovenian"
  | "croatian"
  | "dutch"
  | "dutch_1k"
  | "dutch_10k"
  | "filipino"
  | "filipino_1k"
  | "danish"
  | "danish_1k"
  | "danish_10k"
  | "hungarian"
  | "hungarian_2.5k"
  | "norwegian"
  | "norwegian_1k"
  | "norwegian_5k"
  | "norwegian_10k"
  | "hebrew"
  | "icelandic_1k"
  | "romanian"
  | "finnish"
  | "finnish_1k"
  | "finnish_10k"
  | "estonian"
  | "estonian_1k"
  | "estonian_10k"
  | "welsh"
  | "welsh_1k"
  | "persian"
  | "kazakh"
  | "vietnamese"
  | "vietnamese_1k"
  | "vietnamese_5k"
  | "pinyin"
  | "pinyin_1k"
  | "pinyin_10k"
  | "swedish"
  | "swedish_1k"
  | "serbian"
  | "yoruba_1k"
  | "swahili_1k"
  | "maori_1k"
  | "catalan"
  | "catalan_1k"
  | "lojban_gismu"
  | "lojban_cmavo"
  | "lithuanian"
  | "lithuanian_1k"
  | "lithuanian_3k"
  | "bulgarian"
  | "bangla"
  | "bangla_letters"
  | "bangla_10k"
  | "toki_pona"
  | "esperanto"
  | "esperanto_1k"
  | "esperanto_10k"
  | "esperanto_25k"
  | "esperanto_36k"
  | "esperanto_x_sistemo"
  | "esperanto_x_sistemo_1k"
  | "esperanto_x_sistemo_10k"
  | "esperanto_x_sistemo_25k"
  | "esperanto_x_sistemo_36k"
  | "esperanto_h_sistemo"
  | "esperanto_h_sistemo_1k"
  | "esperanto_h_sistemo_10k"
  | "esperanto_h_sistemo_25k"
  | "esperanto_h_sistemo_36k"
  | "urdu"
  | "urdu_1k"
  | "albanian"
  | "albanian_1k"
  | "japanese_hiragana"
  | "japanese_katakana"
  | "twitch_emotes"
  | "git"
  | "pig_latin"
  | "code_python"
  | "code_c"
  | "code_csharp"
  | "code_css"
  | "code_c++"
  | "code_dart"
  | "code_javascript"
  | "code_javascript_1k"
  | "code_html"
  | "code_pascal"
  | "code_java"
  | "code_kotlin"
  | "code_go"
  | "code_rust"
  | "code_ruby"
  | "code_r"
  | "code_swift"
  | "code_bash"
  | "hindi"
  | "hindi_1k"
  | "macedonian"
  | "macedonian_1k"
  | "macedonian_10k"
  | "macedonian_75k"
  | "belarusian_1k";

export declare type LanguageGroup =
  | "english"
  | "spanish"
  | "french"
  | "german"
  | "portuguese"
  | "arabic"
  | "italian"
  | "mongolian"
  | "russian"
  | "polish"
  | "czech"
  | "slovak"
  | "ukrainian"
  | "lithuanian"
  | "indonesian"
  | "greek"
  | "turkish"
  | "irish"
  | "thai"
  | "tamil"
  | "slovenian"
  | "croatian"
  | "dutch"
  | "filipino"
  | "danish"
  | "hungarian"
  | "norwegian"
  | "hebrew"
  | "icelandic"
  | "malagasy"
  | "malay"
  | "romanian"
  | "finnish"
  | "estonian"
  | "welsh"
  | "persian"
  | "kazakh"
  | "vietnamese"
  | "pinyin"
  | "swedish"
  | "serbian"
  | "georgian"
  | "yoruba"
  | "swahili"
  | "maori"
  | "catalan"
  | "bulgarian"
  | "esperanto"
  | "bangla"
  | "urdu"
  | "albanian"
  | "japanese"
  | "code"
  | "other"
  | "hindi"
  | "macedonian"
  | "belarusian";

export declare type Theme =
  | "dark"
  | "muted"
  | "dark_magic_girl"
  | "8008"
  | "carbon"
  | "our_theme"
  | "dots"
  | "nautilus"
  | "serika"
  | "serika_dark"
  | "bushido"
  | "red_samurai"
  | "rgb"
  | "oblivion"
  | "magic_girl"
  | "metropolis"
  | "mountain"
  | "laser"
  | "retro"
  | "dracula"
  | "nord"
  | "mr_sleeves"
  | "olivia"
  | "bliss"
  | "mizu"
  | "metaverse"
  | "shadow"
  | "mint"
  | "miami"
  | "miami_nights"
  | "modern_dolch"
  | "botanical"
  | "9009"
  | "bingsu"
  | "terminal"
  | "lavender"
  | "taro"
  | "striker"
  | "gruvbox_dark"
  | "gruvbox_light"
  | "monokai"
  | "sonokai"
  | "camping"
  | "voc"
  | "vaporwave"
  | "pulse"
  | "matrix"
  | "olive"
  | "strawberry"
  | "night_runner"
  | "cyberspace"
  | "joker"
  | "dualshot"
  | "solarized_dark"
  | "solarized_light"
  | "terra"
  | "red_dragon"
  | "hammerhead"
  | "future_funk"
  | "milkshake"
  | "aether"
  | "froyo"
  | "retrocast"
  | "luna"
  | "graen"
  | "bento"
  | "watermelon"
  | "menthol"
  | "ishtar"
  | "mashu"
  | "deku"
  | "honey"
  | "shoko"
  | "norse"
  | "matcha_moccha"
  | "cafe"
  | "alpine"
  | "superuser"
  | "ms_cupcakes"
  | "dollar"
  | "lime"
  | "sweden"
  | "wavez"
  | "nebula"
  | "lil_dragon"
  | "pastel"
  | "alduin"
  | "paper"
  | "fundamentals"
  | "drowning"
  | "iceberg_dark"
  | "iceberg_light"
  | "onedark"
  | "darling"
  | "repose_dark"
  | "repose_light"
  | "horizon"
  | "rudy"
  | "stealth"
  | "80s_after_dark"
  | "fleuriste";

export declare type Layout =
  | "default"
  | "qwerty"
  | "dvorak"
  | "colemak"
  | "colemak_dh"
  | "colemak_dh_wide"
  | "colemak_dhk"
  | "colemak_dh_matrix"
  | "colemak_dh_iso"
  | "colemak_dhk_iso"
  | "colemak_dhv"
  | "qwertz"
  | "workman"
  | "turkish_f"
  | "MTGAP_ASRT"
  | "norman"
  | "halmak"
  | "QGMLWB"
  | "QGMLWY"
  | "qwpr"
  | "spanish_qwerty"
  | "latam_qwerty"
  | "prog_dvorak"
  | "german_dvorak"
  | "spanish_dvorak"
  | "dvorak_L"
  | "dvorak_R"
  | "azerty"
  | "bepo"
  | "alpha"
  | "handsdown"
  | "handsdown_alt"
  | "typehack"
  | "MTGAP"
  | "MTGAP_full"
  | "ina"
  | "soul"
  | "niro"
  | "JCUKEN"
  | "Diktor"
  | "Diktor_VoronovMod"
  | "Redaktor"
  | "JUIYAF"
  | "Zubachev"
  | "ISRT"
  | "ISRT_Angle"
  | "colemak_Qix"
  | "colemak_Qi"
  | "colemaQ"
  | "colemaQ_F"
  | "engram"
  | "semimak"
  | "semimak_jq"
  | "boo"
  | "boo_mangle"
  | "APT"
  | "APT_angle"
  | "thai_kedmanee"
  | "thai_pattachote"
  | "thai_manoonchai"
  | "persian_standard"
  | "arabic"
  | "arabic_mac"
  | "brasileiro_nativo"
  | "Foalmak"
  | "quartz"
  | "arensito"
  | "ARTS"
  | "beakl_15"
  | "beakl_19"
  | "beakl_19_bis"
  | "capewell_dvorak"
  | "colman"
  | "heart"
  | "klauser"
  | "oneproduct"
  | "pine"
  | "real"
  | "rolll"
  | "stndc"
  | "three"
  | "uciea"
  | "asset"
  | "dwarf"
  | "flaw"
  | "whorf"
  | "whorf6"
  | "sertain"
  | "ctgap"
  | "ctgap_3"
  | "octa8";

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

export declare type Funbox =
  | "none"
  | "nausea"
  | "round_round_baby"
  | "simon_says"
  | "mirror"
  | "tts"
  | "choo_choo"
  | "arrows"
  | "rAnDoMcAsE"
  | "capitals"
  | "layoutfluid"
  | "earthquake"
  | "space_balls"
  | "gibberish"
  | "58008"
  | "ascii"
  | "specials"
  | "plus_one"
  | "plus_two"
  | "read_ahead_easy"
  | "read_ahead"
  | "read_ahead_hard"
  | "memory"
  | "nospace"
  | "poetry"
  | "wikipedia"
  | "weakspot"
  | "pseudolang";

export declare type FunboxJSONType = "script" | "style";

export declare interface FunboxJSON {
  name: Funbox;
  type: FunboxJSONType;
  info: string;
}

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

export declare type FontFamily =
  | "roboto_mono"
  | "source_code_pro"
  | "ibm_plex_sans"
  | "inconsolata"
  | "fira_code"
  | "jetbrains_mono"
  | "roboto"
  | "montserrat"
  | "titillium_web"
  | "lexend_deca"
  | "comic_sans_ms"
  | "oxygen"
  | "nunito"
  | "itim"
  | "courier"
  | "comfortaa"
  | "coming_soon"
  | "atkinson_hyperlegible"
  | "lato"
  | "lalezar";

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
  keySpacingStats: {
    average: number;
    sd: number;
  };
  keyDurationStats: {
    average: number;
    sd: number;
  };
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
