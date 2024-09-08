type Mode = import("@monkeytype/contracts/schemas/shared").Mode;
type Result<M extends Mode> =
  import("@monkeytype/contracts/schemas/results").Result<M>;
type IncompleteTest =
  import("@monkeytype/contracts/schemas/results").IncompleteTest;

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
    | "404"
    | "accountSettings";

  type LanguageGroup = {
    name: string;
    languages: string[];
  };

  type AddNotificationOptions = {
    important?: boolean;
    duration?: number;
    customTitle?: string;
    customIcon?: string;
    closeCallback?: () => void;
    allowHTML?: boolean;
  };

  type Accents = [string, string][];

  type LanguageObject = {
    name: string;
    rightToLeft: boolean;
    noLazyMode?: boolean;
    ligatures?: boolean;
    orderedByFrequency?: boolean;
    words: string[];
    additionalAccents: Accents;
    bcp47?: string;
    originalPunctuation?: boolean;
  };

  type DefaultWordsModes = 10 | 25 | 50 | 100;

  type DefaultTimeModes = 15 | 30 | 60 | 120;

  type QuoteModes = "short" | "medium" | "long" | "thicc";

  type CustomLayoutFluidSpaces =
    | import("@monkeytype/contracts/schemas/configs").CustomLayoutFluid
    | `${string} ${string} ${string}`;

  type HistoryChartData = {
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
  };

  type AccChartData = {
    x: number;
    y: number;
    errorRate: number;
  };

  type OtherChartData = {
    x: number;
    y: number;
  };

  type ActivityChartDataPoint = {
    x: number;
    y: number;
    amount?: number;
  };

  type FontObject = {
    name: string;
    display?: string;
    systemFont?: string;
  };

  type FunboxWordsFrequency = "normal" | "zipf";

  type FunboxWordOrder = "normal" | "reverse";

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
    | "changesWordsFrequency"
    | `wordOrder:${FunboxWordOrder}`;

  class Wordset {
    words: string[];
    length: number;
    orderedIndex: number;
    shuffledIndexes: number[];
    constructor(words: string[]);
    resetIndexes(): void;
    randomWord(mode: MonkeyTypes.FunboxWordsFrequency): string;
    shuffledWord(): string;
    generateShuffledIndexes(): void;
    nextWord(): string;
  }

  class Section {
    public title: string;
    public author: string;
    public words: string[];
    constructor(title: string, author: string, words: string[]);
  }

  type FunboxFunctions = {
    getWord?: (wordset?: Wordset, wordIndex?: number) => string;
    punctuateWord?: (word: string) => string;
    withWords?: (words?: string[]) => Promise<Wordset>;
    alterText?: (word: string) => string;
    applyConfig?: () => void;
    applyGlobalCSS?: () => void;
    clearGlobal?: () => void;
    rememberSettings?: () => void;
    toggleScript?: (params: string[]) => void;
    pullSection?: (language?: string) => Promise<Section | false>;
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
  };

  type FunboxForcedConfig = Record<
    string,
    import("@monkeytype/contracts/schemas/configs").ConfigValue[]
  >;

  type FunboxMetadata = {
    name: string;
    info: string;
    canGetPb?: boolean;
    alias?: string;
    forcedConfig?: MonkeyTypes.FunboxForcedConfig;
    properties?: FunboxProperty[];
    functions?: FunboxFunctions;
    hasCSS?: boolean;
  };

  type PresetConfig = {
    tags: string[];
  } & import("@monkeytype/contracts/schemas/configs").Config;

  type SnapshotPreset =
    import("@monkeytype/contracts/schemas/presets").Preset & {
      display: string;
    };

  type RawCustomTheme = {
    name: string;
    colors: import("@monkeytype/contracts/schemas/configs").CustomThemeColors;
  };

  type CustomTheme = {
    _id: string;
  } & RawCustomTheme;

  type ConfigChanges = {
    tags?: string[];
  } & Partial<import("@monkeytype/contracts/schemas/configs").Config>;

  type LeaderboardMemory = {
    time: {
      [_key in "15" | "60"]: Record<string, number>;
    };
  };

  type QuoteRatings = Record<string, Record<number, number>>;

  type UserTag = import("@monkeytype/contracts/schemas/users").UserTag & {
    active?: boolean;
    display: string;
  };

  type Snapshot = Omit<
    import("@monkeytype/contracts/schemas/users").User,
    | "timeTyping"
    | "startedTests"
    | "completedTests"
    | "profileDetails"
    | "streak"
    | "resultFilterPresets"
    | "tags"
    | "xp"
    | "testActivity"
  > & {
    typingStats: {
      timeTyping: number;
      startedTests: number;
      completedTests: number;
    };
    details?: import("@monkeytype/contracts/schemas/users").UserProfileDetails;
    inboxUnreadSize: number;
    streak: number;
    maxStreak: number;
    filterPresets: import("@monkeytype/contracts/schemas/users").ResultFilters[];
    isPremium: boolean;
    streakHourOffset?: number;
    config: import("@monkeytype/contracts/schemas/configs").Config;
    tags: UserTag[];
    presets: SnapshotPreset[];
    results?: MonkeyTypes.FullResult<Mode>[];
    xp: number;
    testActivity?: ModifiableTestActivityCalendar;
    testActivityByYear?: { [key: string]: TestActivityCalendar };
  };

  type TimerStats = {
    dateNow: number;
    now: number;
    expected: number;
    nextDelay: number;
  };

  type GithubRelease = {
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
  };

  type CommandExecOptions = {
    input?: string;
    commandlineModal: import("../utils/animated-modal").default;
  };

  type Command = {
    id: string;
    display: string;
    singleListDisplay?: string;
    singleListDisplayNoIcon?: string;
    subgroup?: CommandsSubgroup;
    found?: boolean;
    icon?: string;
    sticky?: boolean;
    alias?: string;
    input?: boolean;
    visible?: boolean;
    customStyle?: string;
    opensModal?: boolean;
    defaultValue?: () => string;
    configKey?: keyof import("@monkeytype/contracts/schemas/configs").Config;
    configValue?: string | number | boolean | number[];
    configValueMode?: "include";
    exec?: (options: CommandExecOptions) => void;
    hover?: () => void;
    available?: () => boolean;
    active?: () => boolean;
    shouldFocusTestUI?: boolean;
    customData?: Record<string, string | boolean>;
  };

  type CommandsSubgroup = {
    title: string;
    configKey?: keyof import("@monkeytype/contracts/schemas/configs").Config;
    list: Command[];
    beforeList?: () => void;
  };

  type Theme = {
    name: string;
    bgColor: string;
    mainColor: string;
    subColor: string;
    textColor: string;
  };

  type Quote = {
    text: string;
    britishText?: string;
    source: string;
    length: number;
    id: number;
    group: number;
    language: string;
    textSplit?: string[];
  };

  type QuoteWithTextSplit = Quote & {
    textSplit: string[];
  };

  type ThemeColors = {
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
  };

  type Layout = {
    keymapShowTopRow: boolean;
    matrixShowRightColumn?: boolean;
    type: "iso" | "ansi" | "ortho" | "matrix";
    keys: Keys;
  };

  type Layouts = Record<string, Layout>;
  type Keys = {
    row1: string[];
    row2: string[];
    row3: string[];
    row4: string[];
    row5: string[];
  };

  type WpmAndRaw = {
    wpm: number;
    raw: number;
  };

  type Challenge = {
    name: string;
    display: string;
    autoRole: boolean;
    type: string;
    parameters: (string | number | boolean)[];
    message: string;
    requirements: Record<string, Record<string, string | number | boolean>>;
  };

  type UserBadge = {
    id: number;
    name: string;
    description: string;
    icon?: string;
    background?: string;
    color?: string;
    customStyle?: string;
  };

  type MonkeyMail = {
    id: string;
    subject: string;
    body: string;
    timestamp: number;
    read: boolean;
    rewards: AllRewards[];
  };

  type Reward<T> = {
    type: string;
    item: T;
  };

  type XpReward = {
    type: "xp";
    item: number;
  } & Reward<number>;

  type BadgeReward = {
    type: "badge";
    item: import("@monkeytype/contracts/schemas/users").Badge;
  } & Reward<import("@monkeytype/contracts/schemas/users").Badge>;

  type AllRewards = XpReward | BadgeReward;

  type TypingSpeedUnitSettings = {
    fromWpm: (number: number) => number;
    toWpm: (number: number) => number;
    fullUnitString: string;
    histogramDataBucketSize: number;
    historyStepSize: number;
  };

  type TestActivityCalendar = {
    getMonths: () => TestActivityMonth[];
    getDays: () => TestActivityDay[];
    getTotalTests: () => number;
  };

  type ModifiableTestActivityCalendar = TestActivityCalendar & {
    increment: (date: Date) => void;
    getFullYearCalendar: () => TestActivityCalendar;
  };

  type TestActivityDay = {
    level: string;
    label?: string;
  };

  type TestActivityMonth = {
    text: string;
    weeks: number;
  };

  /**
   * Result from the rest api but all omittable default values are set (and non optional)
   */
  type FullResult<M extends Mode> = Omit<
    Result<M>,
    | "restartCount"
    | "incompleteTestSeconds"
    | "afkDuration"
    | "tags"
    | "bailedOut"
    | "blindMode"
    | "lazyMode"
    | "funbox"
    | "language"
    | "difficulty"
    | "numbers"
    | "punctuation"
  > & {
    restartCount: number;
    incompleteTestSeconds: number;
    afkDuration: number;
    tags: string[];
    bailedOut: boolean;
    blindMode: boolean;
    lazyMode: boolean;
    funbox: string;
    language: string;
    difficulty: import("@monkeytype/contracts/schemas/shared").Difficulty;
    numbers: boolean;
    punctuation: boolean;
  };
  type CustomTextLimit = {
    value: number;
    mode: import("@monkeytype/contracts/schemas/util").CustomTextLimitMode;
  };

  type CustomTextData = Omit<
    import("@monkeytype/contracts/schemas/results").CustomTextDataWithTextLen,
    "textLen"
  > & {
    text: string[];
  };
}
