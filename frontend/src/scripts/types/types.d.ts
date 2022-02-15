declare namespace MonkeyTypes {
  declare type Difficulty = "normal" | "expert" | "master";

  declare type CustomModes = "custom";

  declare type Mode = "time" | "words" | "quote" | "zen" | CustomModes;

  declare type Mode2<M extends Mode> = keyof PersonalBests[M];

  declare type LanguageGroup = { name: string; languages: string[] };

  // declare type Mode2 = 10 | 15 | 25 | 30 | 50 | 60 | 100 | 120 | 200 | "zen" | "custom";

  declare type NoncustomWordsModes = 10 | 25 | 50 | 100 | 200;

  declare type WordsModes = NoncustomWordsModes | CustomModes;

  declare type NoncustomTimeModes = 15 | 30 | 60 | 120;

  declare type TimeModes = NoncustomTimeModes | CustomModes;

  declare type QuoteModes = "short" | "medium" | "long" | "thicc";

  declare type QuoteLength = -1 | 0 | 1 | 2 | 3;

  declare type QuoteLengthArray = QuoteLength[];

  declare type FontSize = 1 | 125 | 15 | 2 | 3 | 4;

  declare type CaretStyle =
    | "off"
    | "default"
    | "block"
    | "outline"
    | "underline"
    | "carrot"
    | "banana";

  declare type ConfidenceMode = "off" | "on" | "max";

  declare type TimerStyle = "bar" | "text" | "mini";

  declare type RandomTheme = "off" | "on" | "favorite" | "light" | "dark";

  declare type TimerColor = "black" | "sub" | "text" | "main";

  declare type TimerOpacity = "0.25" | "0.5" | "0.75" | "1";

  declare type StopOnError = "off" | "word" | "letter";

  declare type KeymapMode = "off" | "static" | "react" | "next";

  declare type KeymapStyle =
    | "staggered"
    | "alice"
    | "matrix"
    | "split"
    | "split_matrix";

  declare type KeymapLegendStyle = "lowercase" | "uppercase" | "blank";

  declare type SingleListCommandLine = "manual" | "on";

  declare type PlaySoundOnClick =
    | "off"
    | "click"
    | "beep"
    | "pop"
    | "nk_creams"
    | "typewriter"
    | "osu"
    | "hitmarker";

  declare type SoundVolume = "0.1" | "0.5" | "1.0";

  declare type PaceCaret = "off" | "average" | "pb" | "custom";

  declare type PageWidth = "100" | "125" | "150" | "200" | "max";

  declare type ChartStyle = "line" | "scatter";

  declare type MinimumWordsPerMinute = "off" | "custom";

  declare type HighlightMode = "off" | "letter" | "word";

  declare type EnableAds = "off" | "on" | "sellout";

  declare type MinimumAccuracy = "off" | "custom";

  declare type RepeatQuotes = "off" | "typing";

  declare type OppositeShiftMode = "off" | "on" | "keymap";

  declare type CustomBackgroundSize = "cover" | "contain" | "max";

  declare type CustomBackgroundFilter = [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1];

  declare type MonkeyPowerLevel =
    | "off"
    | "mellow"
    | "high"
    | "ultra"
    | "over_9000";

  declare type MinimumBurst = "off" | "fixed" | "flex";

  declare type FunboxObjectType = "script" | "style";

  declare interface FunboxObject {
    name: string;
    type: FunboxObjectType;
    info: string;
  }

  declare interface CustomText {
    text: string[];
    isWordRandom: boolean;
    isTimeRandom: boolean;
    word: number;
    time: number;
    delimiter: string;
  }

  declare interface Preset {
    _id: string;
    name: string;
    config: Config;
  }

  declare interface PersonalBest {
    acc: number;
    consistency: number;
    difficulty: Difficulty;
    lazyMode: boolean;
    language: string;
    punctuation: boolean;
    raw: number;
    wpm: number;
    timestamp: number;
  }

  declare interface PersonalBests {
    time: {
      [key: number]: PersonalBest[];
      custom: PersonalBest[];
    };
    words: {
      [key: number]: PersonalBest[];
      custom: PersonalBest[];
    };
    quote: { [quote: string]: PersonalBest[] };
    custom: { custom: PersonalBest[] };
    zen: PersonalBest[];
  }

  declare interface Tag {
    _id: string;
    name: string;
    personalBests: PersonalBests | Record<string, never>;
    active: boolean;
  }

  declare interface Stats {
    time: number;
    started: number;
    completed: number;
  }

  declare interface ChartData {
    wpm: number[];
    raw: number[];
    err: number[];
  }

  declare interface KeyStats {
    average: number;
    sd: number;
  }

  declare interface Result {
    _id: string;
    wpm: number;
    rawWpm: number;
    charStats: number[];
    correctChars?: number; // --------------
    incorrectChars?: number; // legacy results
    acc: number;
    mode: Mode;
    mode2: number | "custom" | "zen";
    quoteLength: number;
    timestamp: number;
    restartCount: number;
    incompleteTestSeconds: number;
    testDuration: number;
    afkDuration: number;
    tags: string[];
    consistency: number;
    keyConsistency: number;
    chartData: ChartData | "toolong";
    uid: string;
    keySpacingStats: KeyStats;
    keyDurationStats: KeyStats;
    isPb?: boolean;
    bailedOut?: boolean;
    blindMode?: boolean;
    lazyMode?: boolean;
    difficulty: Difficulty;
    funbox?: string;
    language: string;
    numbers?: boolean;
    punctuation?: boolean;
  }

  declare interface Config {
    theme: string;
    customTheme: boolean;
    customThemeColors: string[];
    favThemes: string[];
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
    quoteLength: QuoteLengthArray;
    language: string;
    fontSize: FontSize;
    freedomMode: boolean;
    resultFilters?: ResultFilters | null;
    difficulty: Difficulty;
    blindMode: boolean;
    quickEnd: boolean;
    caretStyle: CaretStyle;
    paceCaretStyle: CaretStyle;
    flipTestColors: boolean;
    layout: string;
    funbox: string;
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
    keymapLayout: string;
    fontFamily: string;
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
    minBurst: MinimumBurst;
    minBurstCustomSpeed: number;
    burstHeatmap: boolean;
    britishEnglish: boolean;
    lazyMode: boolean;
  }

  declare interface DefaultConfig extends Config {
    wordCount: WordsModes;
  }

  declare interface Leaderboards {
    time: {
      [key in 15 | 60]: LeaderboardEntry[];
    };
  }

  declare interface LeaderboardEntry {
    _id: string;
    difficulty: string;
    timestamp: number;
    language: string;
    wpm: number;
    consistency: number | "-";
    punctuation: boolean;
    acc: number;
    raw: number;
    uid?: string;
    name: string;
    discordId?: string;
    rank: number;
    count?: number;
    hidden?: boolean;
  }

  // TODO find structure of Leaderboard
  declare interface Leaderboard {
    [key: string]: any;
  }

  declare interface Snapshot {
    banned?: boolean;
    emailVerified?: boolean;
    quoteRatings?: object; // TODO find structure of quoteRatings
    results?: Result[];
    verified?: boolean;
    personalBests?: PersonalBests;
    name?: string;
    presets?: Preset[];
    tags?: Tag[];
    favouriteThemes?: string[];
    lbMemory?: Leaderboards;
    globalStats?: Stats;
    quoteMod?: boolean;
    discordId?: string;
    config?: Config;
  }

  declare interface ResultFilters {
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

  declare type Group = keyof ResultFilters;

  declare type Filter<G extends Group> = keyof ResultFilters[G];

  declare interface TimerStats {
    dateNow: number;
    now: number;
    expected: number;
    nextDelay: number;
  }

  declare interface GithubRelease {
    url: string;
    assets_url: string;
    upload_url: string;
    html_url: string;
    id: number;
    author: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    };
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    draft: boolean;
    prerelease: boolean;
    created_at: string;
    published_at: string;
    assets: any[];
    tarball_url: string;
    zipball_url: string;
    body: string;
    reactions: {
      url: string;
      total_count: number;
      [reaction: string]: number | string;
    };
  }

  // eslint-disable-next-line no-unused-vars
  declare type ExecFunction = (input?: any) => any;

  export interface Command {
    id: string;
    display: string;
    subgroup?: CommandsGroup | boolean;
    icon?: string;
    noIcon?: boolean;
    sticky?: boolean;
    alias?: string;
    input?: boolean;
    visible?: boolean;
    defaultValue?: string;
    configValue?: string | number | boolean | number[];
    configValueMode?: string;
    exec?: ExecFunction;
    hover?: ExecFunction;
    available?: () => void;
    beforeSubgroup?: () => void;
  }

  export interface CommandsGroup {
    title: string;
    configKey?: keyof Config;
    list: Command[];
  }

  declare interface Quote {
    text: string;
    source: string;
    length: number;
    id: number | string;
    group?: number;
    language: string;
  }

  // declare type Page = "Loading" | "Account" | "Settings" | "About" | "Test";

  // declare type ActivePage = `page${Page}` | undefined;

  declare interface PSA {
    sticky?: boolean;
    message: string;
    _id: string;
    level?: number;
  }

  declare interface ThemeColors {
    bg: string;
    main: string;
    caret: string;
    sub: string;
    text: string;
    error: string;
    errorExtra: string;
    colorfulError: string;
    colorfulErrorExtra: string;
  }
}
