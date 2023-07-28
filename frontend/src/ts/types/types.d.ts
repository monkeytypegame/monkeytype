type typesSeparatedWithHash<T> = T | `${T}#${typesSeparatedWithHash<T>}`;

declare namespace MonkeyTypes {
  type PageName =
    | "loading"
    | "test"
    | "settings"
    | "about"
    | "account"
    | "login"
    | "profile"
    | "profileSearch"
    | "404";

  type Difficulty = "normal" | "expert" | "master";

  type Mode = keyof PersonalBests;

  type Mode2<M extends Mode> = M extends M ? keyof PersonalBests[M] : never;

  type StringNumber = `${number}`;

  type Mode2Custom<M extends Mode> = Mode2<M> | "custom";

  interface LanguageGroup {
    name: string;
    languages: string[];
  }

  type Accents = [string, string][];

  interface LanguageObject {
    name: string;
    rightToLeft: boolean;
    noLazyMode?: boolean;
    ligatures?: boolean;
    orderedByFrequency?: boolean;
    words: string[];
    accents: Accents;
    bcp47?: string;
    originalPunctuation?: boolean;
  }

  type WordsModes = number;

  type TimeModes = number;

  type DefaultWordsModes = 10 | 25 | 50 | 100;

  type DefaultTimeModes = 15 | 30 | 60 | 120;

  type QuoteModes = "short" | "medium" | "long" | "thicc";

  type QuoteLength = -3 | -2 | -1 | 0 | 1 | 2 | 3;

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

  type RandomTheme = "off" | "on" | "fav" | "light" | "dark" | "custom";

  type TimerColor = "black" | "sub" | "text" | "main";

  type TimerOpacity = "0.25" | "0.5" | "0.75" | "1";

  type StopOnError = "off" | "word" | "letter";

  type KeymapMode = "off" | "static" | "react" | "next";

  type KeymapStyle =
    | "staggered"
    | "alice"
    | "matrix"
    | "split"
    | "split_matrix"
    | "steno"
    | "steno_matrix";

  type KeymapLegendStyle = "lowercase" | "uppercase" | "blank" | "dynamic";

  type KeymapShowTopRow = "always" | "layout" | "never";

  type ShowAverage = "off" | "wpm" | "acc" | "both";

  type SmoothCaretMode = "off" | "slow" | "medium" | "fast";

  type TapeMode = "off" | "letter" | "word";

  type SingleListCommandLine = "manual" | "on";

  /*
    off = off
    1 = click
    2 = beep
    3 = pop
    4 = nk creams
    5 = typewriter
    6 = osu
    7 = hitmarker
    8 = sine
    9 = sawtooth
    10 = square
    11 = triangle
    12 = pentatonic
    13 = wholetone
  */
  type PlaySoundOnClick =
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
    | "13";

  type SoundVolume = "0.1" | "0.5" | "1.0";

  type PaceCaret = "off" | "average" | "pb" | "last" | "custom" | "daily";

  type PageWidth = "100" | "125" | "150" | "200" | "max";

  type AccountChart = ("off" | "on")[];

  type MinimumWordsPerMinute = "off" | "custom";

  type HighlightMode = "off" | "letter" | "word";

  type Ads = "off" | "result" | "on" | "sellout";

  type MinimumAccuracy = "off" | "custom";

  type RepeatQuotes = "off" | "typing";

  type OppositeShiftMode = "off" | "on" | "keymap";

  type CustomBackgroundSize = "cover" | "contain" | "max";

  type CustomBackgroundFilter = [number, number, number, number, number];

  /*
    off = off
    1 = mellow
    2 = high
    3 = ultra
    4 = over 9000
  */
  type MonkeyPowerLevel = "off" | "1" | "2" | "3" | "4";

  type MinimumBurst = "off" | "fixed" | "flex";

  type IndicateTypos = "off" | "below" | "replace";

  type CustomLayoutFluid = `${string}#${string}#${string}`;

  type CustomLayoutFluidSpaces =
    | CustomLayoutFluid
    | `${string} ${string} ${string}`;

  interface HistoryChartData {
    x: number;
    y: number;
    wpm: number;
    acc: number;
    mode: string;
    mode2: string;
    punctuation: boolean;
    language: string;
    timestamp: number;
    difficulty: string;
    raw: number;
    isPb: boolean;
  }

  interface AccChartData {
    x: number;
    y: number;
    errorRate: number;
  }

  interface OtherChartData {
    x: number;
    y: number;
  }

  interface ActivityChartDataPoint {
    x: number;
    y: number;
    amount?: number;
  }

  interface FontObject {
    name: string;
    display?: string;
  }

  type FunboxWordsFrequency = "normal" | "zipf";

  type FunboxProperty =
    | "symmetricChars"
    | "conflictsWithSymmetricChars"
    | "changesWordsVisibility"
    | "speaks"
    | "unspeakable"
    | "changesLayout"
    | "ignoresLayout"
    | "usesLayout"
    | "ignoresLanguage"
    | "noLigatures"
    | "noLetters"
    | "changesCapitalisation"
    | "nospace"
    | `toPush:${number}`
    | "noInfiniteDuration"
    | "changesWordsFrequency";

  interface FunboxFunctions {
    getWord?: (wordset?: Misc.Wordset, wordIndex?: number) => string;
    punctuateWord?: (word: string) => string;
    withWords?: (words?: string[]) => Promise<Misc.Wordset>;
    alterText?: (word: string) => string;
    applyCSS?: () => void;
    applyConfig?: () => void;
    applyGlobalCSS?: () => void;
    rememberSettings?: () => void;
    toggleScript?: (params: string[]) => void;
    pullSection?: (language?: string) => Promise<Misc.Section | false>;
    handleSpace?: () => void;
    handleChar?: (char: string) => string;
    isCharCorrect?: (char: string, originalChar: string) => boolean;
    preventDefaultEvent?: (
      event: JQuery.KeyDownEvent<Document, null, Document, Document>
    ) => Promise<boolean>;
    handleKeydown?: (
      event: JQuery.KeyDownEvent<Document, null, Document, Document>
    ) => Promise<void>;
    getResultContent?: () => string;
    start?: () => void;
    restart?: () => void;
    getWordHtml?: (char: string, letterTag?: boolean) => string;
    getWordsFrequencyMode?: () => FunboxWordsFrequency;
  }

  interface FunboxForcedConfig {
    [key: string]: ConfigValues[];
    // punctuation?: boolean;
    // numbers?: boolean;
    // highlightMode?: typesSeparatedWithHash<HighlightMode>;
    // words?: FunboxModeDuration;
    // time?: FunboxModeDuration;
  }

  interface FunboxMetadata {
    name: string;
    info: string;
    canGetPb?: boolean;
    alias?: string;
    forcedConfig?: MonkeyTypes.FunboxForcedConfig;
    properties?: FunboxProperty[];
    functions?: FunboxFunctions;
  }

  interface CustomText {
    text: string[];
    isWordRandom: boolean;
    isTimeRandom: boolean;
    word: number;
    time: number;
    delimiter: string;
    textLen?: number;
  }

  interface PresetConfig extends MonkeyTypes.Config {
    tags: string[];
  }

  interface Preset {
    _id: string;
    name: string;
    display: string;
    config: ConfigChanges;
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
    time: Record<StringNumber, PersonalBest[]>;
    words: Record<StringNumber, PersonalBest[]>;
    quote: Record<StringNumber, PersonalBest[]>;
    custom: Partial<Record<"custom", PersonalBest[]>>;
    zen: Partial<Record<"zen", PersonalBest[]>>;
  }

  interface Tag {
    _id: string;
    name: string;
    display: string;
    personalBests: PersonalBests;
    active?: boolean;
  }

  interface RawCustomTheme {
    name: string;
    colors: string[];
  }

  interface CustomTheme extends RawCustomTheme {
    _id: string;
  }

  interface TypingStats {
    timeTyping: number;
    startedTests: number;
    completedTests: number;
  }

  interface ChartData {
    wpm: number[];
    raw: number[];
    err: number[];
    unsmoothedRaw?: number[];
  }

  interface KeyStats {
    average: number;
    sd: number;
  }

  interface IncompleteTest {
    acc: number;
    seconds: number;
  }

  interface Result<M extends Mode> {
    _id: string;
    wpm: number;
    rawWpm: number;
    charStats: number[];
    correctChars?: number; // --------------
    incorrectChars?: number; // legacy results
    acc: number;
    mode: M;
    mode2: Mode2<M>;
    quoteLength: number;
    timestamp: number;
    restartCount: number;
    incompleteTestSeconds: number;
    incompleteTests: IncompleteTest[];
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
    hash?: string;
  }

  interface ApeKey {
    name: string;
    enabled: boolean;
    createdOn: number;
    modifiedOn: number;
    lastUsedOn: number;
  }

  interface ApeKeys {
    [key: string]: ApeKey;
  }

  interface Config {
    theme: string;
    themeLight: string;
    themeDark: string;
    autoSwitchTheme: boolean;
    customTheme: boolean;
    customThemeColors: string[];
    favThemes: string[];
    showKeyTips: boolean;
    showLiveWpm: boolean;
    showTimerProgress: boolean;
    smoothCaret: SmoothCaretMode;
    quickRestart: "off" | "esc" | "tab";
    punctuation: boolean;
    numbers: boolean;
    words: WordsModes;
    time: TimeModes;
    mode: Mode;
    quoteLength: QuoteLength[];
    language: string;
    fontSize: number;
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
    indicateTypos: IndicateTypos;
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
    keymapShowTopRow: KeymapShowTopRow;
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
    showOutOfFocusWarning: boolean;
    paceCaret: PaceCaret;
    paceCaretCustomSpeed: number;
    repeatedPace: boolean;
    pageWidth: PageWidth;
    accountChart: AccountChart;
    minWpm: MinimumWordsPerMinute;
    minWpmCustomSpeed: number;
    highlightMode: HighlightMode;
    alwaysShowCPM: boolean;
    ads: Ads;
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
    customLayoutfluid: CustomLayoutFluid;
    monkeyPowerLevel: MonkeyPowerLevel;
    minBurst: MinimumBurst;
    minBurstCustomSpeed: number;
    burstHeatmap: boolean;
    britishEnglish: boolean;
    lazyMode: boolean;
    showAverage: ShowAverage;
    tapeMode: TapeMode;
  }

  type ConfigValues =
    | string
    | number
    | boolean
    | string[]
    | MonkeyTypes.QuoteLength[]
    | MonkeyTypes.ResultFilters
    | MonkeyTypes.CustomBackgroundFilter
    | null
    | undefined;

  interface ConfigChanges extends Partial<MonkeyTypes.Config> {
    tags?: string[];
  }

  interface DefaultConfig extends Config {
    wordCount: WordsModes;
  }

  interface LeaderboardMemory {
    time: {
      [key in "15" | "60"]: {
        [language: string]: number;
      };
    };
  }

  interface Leaderboards {
    time: {
      [key in 15 | 60]: LeaderboardEntry[];
    };
  }

  interface LeaderboardEntry {
    uid: string;
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
    discordAvatar?: string;
    badgeId?: number;
    rank: number;
    count?: number;
    hidden?: boolean;
  }

  interface QuoteRatings {
    [language: string]: {
      [id: number]: number;
    };
  }

  interface Snapshot {
    banned?: boolean;
    emailVerified?: boolean;
    quoteRatings?: QuoteRatings;
    results?: Result<Mode>[];
    verified?: boolean;
    personalBests: PersonalBests;
    name: string;
    customThemes: CustomTheme[];
    presets?: Preset[];
    tags: Tag[];
    favouriteThemes?: string[];
    lbMemory?: LeaderboardMemory;
    typingStats?: TypingStats;
    quoteMod?: boolean;
    discordId?: string;
    config?: Config;
    favoriteQuotes: FavoriteQuotes;
    needsToChangeName?: boolean;
    discordAvatar?: string;
    details?: UserDetails;
    inventory?: UserInventory;
    addedAt: number;
    filterPresets: ResultFilters[];
    xp: number;
    inboxUnreadSize: number;
    streak: number;
    maxStreak: number;
    streakHourOffset?: number;
    lbOptOut?: boolean;
  }

  interface UserDetails {
    bio?: string;
    keyboard?: string;
    socialProfiles: {
      twitter?: string;
      github?: string;
      website?: string;
    };
  }

  interface UserInventory {
    badges: Badge[];
  }

  interface Badge {
    id: number;
    selected?: boolean;
  }

  type FavoriteQuotes = Record<string, string[]>;

  interface ResultFilters {
    _id: string;
    name: string;
    pb: {
      no: boolean;
      yes: boolean;
    };
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
      "10": boolean;
      "25": boolean;
      "50": boolean;
      "100": boolean;
      custom: boolean;
    };
    time: {
      "15": boolean;
      "30": boolean;
      "60": boolean;
      "120": boolean;
      custom: boolean;
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
    tags: Record<string, boolean>;
    language: Record<string, boolean>;
    funbox: {
      none?: boolean;
    } & Record<string, boolean>;
  }

  type Group<G extends keyof ResultFilters> = G extends G
    ? ResultFilters[G]
    : never;

  type Filter<G extends Group> = G extends G ? keyof ResultFilters[G] : never;

  interface TimerStats {
    dateNow: number;
    now: number;
    expected: number;
    nextDelay: number;
  }

  interface Global {
    snapshot(): Snapshot | undefined;
    config: Config;
    toggleFilterDebug(): void;
    glarsesMode(): void;
    stats(): void;
    replay(): string;
    enableTimerDebug(): void;
    getTimerStats(): TimerStats[];
    toggleUnsmoothedRaw(): void;
    enableSpacingDebug(): void;
    noGoogleNoMo(): void;
    egVideoListener(options: Record<string, string>): void;
    wpmCalculationDebug(): void;
    toggleDebugLogs(): void;
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
    assets: unknown[];
    tarball_url: string;
    zipball_url: string;
    body: string;
    reactions: {
      url: string;
      total_count: number;
      [reaction: string]: number | string;
    };
  }

  interface Command {
    id: string;
    display: string;
    subgroup?: CommandsSubgroup;
    found?: boolean;
    icon?: string;
    noIcon?: boolean;
    sticky?: boolean;
    alias?: string;
    input?: boolean;
    visible?: boolean;
    customStyle?: string;
    defaultValue?: () => string;
    configValue?: string | number | boolean | number[];
    configValueMode?: string;
    exec?: (input?: string) => void;
    hover?: () => void;
    available?: () => void;
    shouldFocusTestUI?: boolean;
    customData?: Record<string, string>;
  }

  interface CommandsSubgroup {
    title: string;
    configKey?: keyof Config;
    list: Command[];
    beforeList?: () => void;
  }

  interface Theme {
    name: string;
    bgColor: string;
    mainColor: string;
    subColor: string;
    textColor: string;
  }

  interface Quote {
    text: string;
    source: string;
    length: number;
    id: number;
    group: number;
    language: string;
    textSplit?: string[];
  }

  interface PSA {
    sticky?: boolean;
    message: string;
    _id: string;
    level?: number;
    date?: number;
  }

  interface ThemeColors {
    bg: string;
    main: string;
    caret: string;
    sub: string;
    subAlt: string;
    text: string;
    error: string;
    errorExtra: string;
    colorfulError: string;
    colorfulErrorExtra: string;
  }

  interface Layout {
    keymapShowTopRow: boolean;
    type: "iso" | "ansi" | "ortho" | "matrix";
    keys: Keys;
  }

  interface Layouts {
    [layout: string]: Layout;
  }
  interface Keys {
    row1: string[];
    row2: string[];
    row3: string[];
    row4: string[];
    row5: string[];
  }

  interface WordsPerMinuteAndRaw {
    wpm: number;
    raw: number;
  }

  interface Challenge {
    name: string;
    display: string;
    autoRole: boolean;
    type: string;
    parameters: (string | number | boolean)[];
    message: string;
    requirements: {
      [requirement: string]: {
        [parameter: string]: string | number | boolean;
      };
    };
  }

  interface UserBadge {
    id: number;
    name: string;
    description: string;
    icon?: string;
    background?: string;
    color?: string;
    customStyle?: string;
  }

  interface MonkeyMail {
    id: string;
    subject: string;
    body: string;
    timestamp: number;
    read: boolean;
    rewards: AllRewards[];
  }

  interface Reward<T> {
    type: string;
    item: T;
  }

  interface XpReward extends Reward<number> {
    type: "xp";
    item: number;
  }

  interface BadgeReward extends Reward<Badge> {
    type: "badge";
    item: Badge;
  }

  type AllRewards = XpReward | BadgeReward;
}
