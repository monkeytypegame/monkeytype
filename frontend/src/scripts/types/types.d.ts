declare namespace MonkeyTypes {
  type Difficulty = "normal" | "expert" | "master";

  type CustomModes = "custom";

  type Mode = "time" | "words" | "quote" | "zen" | CustomModes;

  type Mode2<M extends Mode> = keyof PersonalBests[M];

  type LanguageGroup = { name: string; languages: string[] };

  //   type Mode2 = 10 | 15 | 25 | 30 | 50 | 60 | 100 | 120 | 200 | "zen" | "custom";

  type NoncustomWordsModes = 10 | 25 | 50 | 100 | 200;

  type WordsModes = NoncustomWordsModes | CustomModes;

  type NoncustomTimeModes = 15 | 30 | 60 | 120;

  type TimeModes = NoncustomTimeModes | CustomModes;

  type QuoteModes = "short" | "medium" | "long" | "thicc";

  type QuoteLength = -1 | 0 | 1 | 2 | 3;

  type QuoteLengthArray = QuoteLength[];

  type FontSize = 1 | 125 | 15 | 2 | 3 | 4;

  type CaretStyle =
    | "off"
    | "default"
    | "block"
    | "outline"
    | "underline"
    | "carrot"
    | "banana";

  type ConfidenceMode = "off" | "on" | "max";

  type TimerStyle = "bar" | "text" | "mini";

  type RandomTheme = "off" | "on" | "favorite" | "light" | "dark";

  type TimerColor = "black" | "sub" | "text" | "main";

  type TimerOpacity = "0.25" | "0.5" | "0.75" | "1";

  type StopOnError = "off" | "word" | "letter";

  type KeymapMode = "off" | "static" | "react" | "next";

  type KeymapStyle =
    | "staggered"
    | "alice"
    | "matrix"
    | "split"
    | "split_matrix";

  type KeymapLegendStyle = "lowercase" | "uppercase" | "blank";

  type SingleListCommandLine = "manual" | "on";

  type PlaySoundOnClick =
    | "off"
    | "click"
    | "beep"
    | "pop"
    | "nk_creams"
    | "typewriter"
    | "osu"
    | "hitmarker";

  type SoundVolume = "0.1" | "0.5" | "1.0";

  type PaceCaret = "off" | "average" | "pb" | "custom";

  type PageWidth = "100" | "125" | "150" | "200" | "max";

  type ChartStyle = "line" | "scatter";

  type MinimumWordsPerMinute = "off" | "custom";

  type HighlightMode = "off" | "letter" | "word";

  type EnableAds = "off" | "on" | "sellout";

  type MinimumAccuracy = "off" | "custom";

  type RepeatQuotes = "off" | "typing";

  type OppositeShiftMode = "off" | "on" | "keymap";

  type CustomBackgroundSize = "cover" | "contain" | "max";

  type CustomBackgroundFilter = [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1];

  type MonkeyPowerLevel = "off" | "mellow" | "high" | "ultra" | "over_9000";

  type MinimumBurst = "off" | "fixed" | "flex";

  type FunboxObjectType = "script" | "style";

  interface FunboxObject {
    name: string;
    type: FunboxObjectType;
    info: string;
  }

  interface CustomText {
    text: string[];
    isWordRandom: boolean;
    isTimeRandom: boolean;
    word: number;
    time: number;
    delimiter: string;
  }

  interface Preset {
    _id: string;
    name: string;
    config: Config;
  }

  interface PersonalBest {
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

  interface PersonalBests {
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

  interface Tag {
    _id: string;
    name: string;
    personalBests: PersonalBests | Record<string, never>;
    active: boolean;
  }

  interface Stats {
    time: number;
    started: number;
    completed: number;
  }

  interface ChartData {
    wpm: number[];
    raw: number[];
    err: number[];
  }

  interface KeyStats {
    average: number;
    sd: number;
  }

  interface Result {
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

  interface Config {
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

  interface DefaultConfig extends Config {
    wordCount: WordsModes;
  }

  interface Leaderboards {
    time: {
      [key in 15 | 60]: LeaderboardEntry[];
    };
  }

  interface LeaderboardEntry {
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

  interface Snapshot {
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

  interface ResultFilters {
    difficulty: {
      normal: boolean;
      expert: boolean;
      master: boolean;
    };
    mode: {
      words: boolean;
      time: boolean;
      quote: boolean;
      zen: boolean;
      custom: boolean;
    };
    words: {
      10: boolean;
      25: boolean;
      50: boolean;
      100: boolean;
    };
    time: {
      15: boolean;
      30: boolean;
      60: boolean;
      120: boolean;
    };
    quoteLength: {
      short: boolean;
      medium: boolean;
      long: boolean;
      thicc: boolean;
    };
    punctuation: {
      on: boolean;
      off: boolean;
    };
    numbers: {
      on: boolean;
      off: boolean;
    };
    date: {
      last_day: boolean;
      last_week: boolean;
      last_month: boolean;
      last_3months: boolean;
      all: boolean;
    };
    tags: {
      [tagId: string]: boolean;
    };
    language: {
      [language: string]: boolean;
    };
    funbox: {
      none?: boolean;
      [funbox: string]: boolean;
    };
  }

  type Group = keyof ResultFilters;

  type Filter<G extends Group> = keyof ResultFilters[G];

  interface TimerStats {
    dateNow: number;
    now: number;
    expected: number;
    nextDelay: number;
  }

  interface GithubRelease {
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
  type ExecFunction = (input?: any) => any;

  interface Command {
    id: string;
    display: string;
    subgroup?: CommandsGroup | boolean;
    found?: boolean;
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

  interface CommandsGroup {
    title: string;
    configKey?: keyof Config;
    list: Command[];
  }

  interface Quote {
    text: string;
    source: string;
    length: number;
    id: number | string;
    group?: number;
    language: string;
  }

  interface PSA {
    sticky?: boolean;
    message: string;
    _id: string;
    level?: number;
  }

  interface ThemeColors {
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

  //  type Page = "Loading" | "Account" | "Settings" | "About" | "Test";

  //  type ActivePage = `page${Page}` | undefined;
}
