// Shared types between server/client.
declare namespace SharedTypes {
  interface ValidModeRule {
    language: string;
    mode: string;
    mode2: string;
  }
  interface RewardBracket {
    minRank: number;
    maxRank: number;
    minReward: number;
    maxReward: number;
  }

  interface Configuration {
    maintenance: boolean;
    quotes: {
      reporting: {
        enabled: boolean;
        maxReports: number;
        contentReportLimit: number;
      };
      submissionsEnabled: boolean;
      maxFavorites: number;
    };
    results: {
      savingEnabled: boolean;
      objectHashCheckEnabled: boolean;
      filterPresets: {
        enabled: boolean;
        maxPresetsPerUser: number;
      };
      limits: {
        regularUser: number;
        premiumUser: number;
      };
      maxBatchSize: number;
    };
    users: {
      signUp: boolean;
      lastHashesCheck: {
        enabled: boolean;
        maxHashes: number;
      };
      autoBan: {
        enabled: boolean;
        maxCount: number;
        maxHours: number;
      };
      profiles: {
        enabled: boolean;
      };
      discordIntegration: {
        enabled: boolean;
      };
      xp: {
        enabled: boolean;
        funboxBonus: number;
        gainMultiplier: number;
        maxDailyBonus: number;
        minDailyBonus: number;
        streak: {
          enabled: boolean;
          maxStreakDays: number;
          maxStreakMultiplier: number;
        };
      };
      inbox: {
        enabled: boolean;
        maxMail: number;
      };
      premium: {
        enabled: boolean;
      };
    };
    admin: {
      endpointsEnabled: boolean;
    };
    apeKeys: {
      endpointsEnabled: boolean;
      acceptKeys: boolean;
      maxKeysPerUser: number;
      apeKeyBytes: number;
      apeKeySaltRounds: number;
    };
    rateLimiting: {
      badAuthentication: {
        enabled: boolean;
        penalty: number;
        flaggedStatusCodes: number[];
      };
    };
    dailyLeaderboards: {
      enabled: boolean;
      leaderboardExpirationTimeInDays: number;
      maxResults: number;
      validModeRules: ValidModeRule[];
      scheduleRewardsModeRules: ValidModeRule[];
      topResultsToAnnounce: number;
      xpRewardBrackets: RewardBracket[];
    };
    leaderboards: {
      weeklyXp: {
        enabled: boolean;
        expirationTimeInDays: number;
        xpRewardBrackets: RewardBracket[];
      };
    };
  }

  type StringNumber = `${number}`;

  interface PersonalBest {
    acc: number;
    consistency?: number;
    difficulty: SharedTypes.Config.Difficulty;
    lazyMode?: boolean;
    language: string;
    punctuation?: boolean;
    numbers?: boolean;
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

  interface IncompleteTest {
    acc: number;
    seconds: number;
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

  interface Result<M extends SharedTypes.Config.Mode> {
    _id: string;
    wpm: number;
    rawWpm: number;
    charStats: [number, number, number, number];
    acc: number;
    mode: M;
    mode2: SharedTypes.Config.Mode2<M>;
    quoteLength?: number;
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
    keySpacingStats?: KeyStats;
    keyDurationStats?: KeyStats;
    isPb: boolean;
    bailedOut: boolean;
    blindMode: boolean;
    lazyMode: boolean;
    difficulty: SharedTypes.Config.Difficulty;
    funbox: string;
    language: string;
    numbers: boolean;
    punctuation: boolean;
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

  type DBResult<T extends SharedTypes.Config.Mode> = Omit<
    SharedTypes.Result<T>,
    | "bailedOut"
    | "blindMode"
    | "lazyMode"
    | "difficulty"
    | "funbox"
    | "language"
    | "numbers"
    | "punctuation"
    | "restartCount"
    | "incompleteTestSeconds"
    | "afkDuration"
    | "tags"
    | "incompleteTests"
    | "customText"
    | "quoteLength"
    | "isPb"
  > & {
    correctChars?: number; // --------------
    incorrectChars?: number; // legacy results
    // --------------
    name: string;
    // -------------- fields that might be removed to save space
    bailedOut?: boolean;
    blindMode?: boolean;
    lazyMode?: boolean;
    difficulty?: SharedTypes.Config.Difficulty;
    funbox?: string;
    language?: string;
    numbers?: boolean;
    punctuation?: boolean;
    restartCount?: number;
    incompleteTestSeconds?: number;
    afkDuration?: number;
    tags?: string[];
    customText?: CustomText;
    quoteLength?: number;
    isPb?: boolean;
  };

  interface CompletedEvent extends Result<SharedTypes.Config.Mode> {
    keySpacing: number[] | "toolong";
    keyDuration: number[] | "toolong";
    customText?: CustomText;
    wpmConsistency: number;
    challenge?: string | null;
    keyOverlap: number;
    lastKeyToEnd: number;
    startToFirstKey: number;
    charTotal: number;
    stringified?: string;
    hash?: string;
  }

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

  interface PSA {
    _id: string;
    message: string;
    sticky?: boolean;
    level?: number;
    date?: number;
  }

  interface SpeedHistogram {
    [key: string]: number;
  }

  interface PublicTypingStats {
    type: string;
    timeTyping: number;
    testsCompleted: number;
    testsStarted: number;
  }

  interface ApeKey {
    name: string;
    enabled: boolean;
    createdOn: number;
    modifiedOn: number;
    lastUsedOn: number;
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
    smoothCaret: SharedTypes.Config.SmoothCaret;
    quickRestart: SharedTypes.Config.QuickRestart;
    punctuation: boolean;
    numbers: boolean;
    words: number;
    time: number;
    mode: SharedTypes.Config.Mode;
    quoteLength: SharedTypes.Config.QuoteLength[];
    language: string;
    fontSize: number;
    freedomMode: boolean;
    difficulty: SharedTypes.Config.Difficulty;
    blindMode: boolean;
    quickEnd: boolean;
    caretStyle: SharedTypes.Config.CaretStyle;
    paceCaretStyle: SharedTypes.Config.CaretStyle;
    flipTestColors: boolean;
    layout: string;
    funbox: string;
    confidenceMode: SharedTypes.Config.ConfidenceMode;
    indicateTypos: SharedTypes.Config.IndicateTypos;
    timerStyle: SharedTypes.Config.TimerStyle;
    colorfulMode: boolean;
    randomTheme: SharedTypes.Config.RandomTheme;
    timerColor: SharedTypes.Config.TimerColor;
    timerOpacity: SharedTypes.Config.TimerOpacity;
    stopOnError: SharedTypes.Config.StopOnError;
    showAllLines: boolean;
    keymapMode: SharedTypes.Config.KeymapMode;
    keymapStyle: SharedTypes.Config.KeymapStyle;
    keymapLegendStyle: SharedTypes.Config.KeymapLegendStyle;
    keymapLayout: string;
    keymapShowTopRow: SharedTypes.Config.KeymapShowTopRow;
    fontFamily: string;
    smoothLineScroll: boolean;
    alwaysShowDecimalPlaces: boolean;
    alwaysShowWordsHistory: boolean;
    singleListCommandLine: SharedTypes.Config.SingleListCommandLine;
    capsLockWarning: boolean;
    playSoundOnError: SharedTypes.Config.PlaySoundOnError;
    playSoundOnClick: SharedTypes.Config.PlaySoundOnClick;
    soundVolume: SharedTypes.Config.SoundVolume;
    startGraphsAtZero: boolean;
    showOutOfFocusWarning: boolean;
    paceCaret: SharedTypes.Config.PaceCaret;
    paceCaretCustomSpeed: number;
    repeatedPace: boolean;
    pageWidth: SharedTypes.Config.PageWidth;
    accountChart: SharedTypes.Config.AccountChart;
    minWpm: SharedTypes.Config.MinimumWordsPerMinute;
    minWpmCustomSpeed: number;
    highlightMode: SharedTypes.Config.HighlightMode;
    typingSpeedUnit: SharedTypes.Config.TypingSpeedUnit;
    ads: SharedTypes.Config.Ads;
    hideExtraLetters: boolean;
    strictSpace: boolean;
    minAcc: SharedTypes.Config.MinimumAccuracy;
    minAccCustom: number;
    showLiveAcc: boolean;
    showLiveBurst: boolean;
    monkey: boolean;
    repeatQuotes: SharedTypes.Config.RepeatQuotes;
    oppositeShiftMode: SharedTypes.Config.OppositeShiftMode;
    customBackground: string;
    customBackgroundSize: SharedTypes.Config.CustomBackgroundSize;
    customBackgroundFilter: SharedTypes.Config.CustomBackgroundFilter;
    customLayoutfluid: SharedTypes.Config.CustomLayoutFluid;
    monkeyPowerLevel: SharedTypes.Config.MonkeyPowerLevel;
    minBurst: SharedTypes.Config.MinimumBurst;
    minBurstCustomSpeed: number;
    burstHeatmap: boolean;
    britishEnglish: boolean;
    lazyMode: boolean;
    showAverage: SharedTypes.Config.ShowAverage;
    tapeMode: SharedTypes.Config.TapeMode;
  }

  type ConfigValue = Config[keyof Config];

  type ConfigPreset = Partial<Config> & {
    tags?: string[];
  };

  interface DBConfigPreset {
    _id: string;
    uid: string;
    name: string;
    config: SharedTypes.ConfigPreset;
  }

  interface LeaderboardEntry {
    _id: string;
    wpm: number;
    acc: number;
    timestamp: number;
    raw: number;
    consistency?: number;
    uid: string;
    name: string;
    discordId?: string;
    discordAvatar?: string;
    rank: number;
    badgeId: number | null;
  }

  type PostResultResponse = {
    isPb: boolean;
    tagPbs: string[];
    insertedId: string;
    dailyLeaderboardRank?: number;
    weeklyXpLeaderboardRank?: number;
    xp: number;
    dailyXpBonus: boolean;
    xpBreakdown: Record<string, number>;
    streak: number;
  };

  type UserStreak = {
    lastResultTimestamp: number;
    length: number;
    maxLength: number;
    hourOffset?: number;
  };

  type UserTag = {
    _id: string;
    name: string;
    personalBests: PersonalBests;
  };

  type UserProfileDetails = {
    bio?: string;
    keyboard?: string;
    socialProfiles: {
      twitter?: string;
      github?: string;
      website?: string;
    };
  };

  type CustomTheme = {
    _id: string;
    name: string;
    colors: string[];
  };

  type PremiumInfo = {
    startTimestamp: number;
    expirationTimestamp: number;
  };

  type UserQuoteRatings = Record<string, Record<string, number>>;

  type UserLbMemory = Record<string, Record<string, Record<string, number>>>;

  type UserInventory = {
    badges: Badge[];
  };

  type Badge = {
    id: number;
    selected?: boolean;
  };

  type User = {
    name: string;
    email: string;
    uid: string;
    addedAt: number;
    personalBests: PersonalBests;
    lastReultHashes?: string[]; //todo: fix typo (its in the db too)
    completedTests?: number;
    startedTests?: number;
    timeTyping?: number;
    streak?: UserStreak;
    xp?: number;
    discordId?: string;
    discordAvatar?: string;
    tags?: UserTag[];
    profileDetails?: UserProfileDetails;
    customThemes?: CustomTheme[];
    premium?: PremiumInfo;
    quoteRatings?: UserQuoteRatings;
    favoriteQuotes?: Record<string, string[]>;
    lbMemory?: UserLbMemory;
    inventory?: UserInventory;
    banned?: boolean;
    lbOptOut?: boolean;
    verified?: boolean;
    needsToChangeName?: boolean;
    quoteMod?: boolean | string;
    resultFilterPresets?: ResultFilters[];
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
    item: SharedTypes.Badge;
  } & Reward<SharedTypes.Badge>;

  type AllRewards = XpReward | BadgeReward;

  type MonkeyMail = {
    id: string;
    subject: string;
    body: string;
    timestamp: number;
    read: boolean;
    rewards: AllRewards[];
  };

  type UserProfile = Pick<
    User,
    | "name"
    | "banned"
    | "addedAt"
    | "discordId"
    | "discordAvatar"
    | "xp"
    | "lbOptOut"
    | "inventory"
    | "uid"
  > & {
    typingStats: {
      completedTests: User["completedTests"];
      startedTests: User["startedTests"];
      timeTyping: User["timeTyping"];
    };
    streak: UserStreak["length"];
    maxStreak: UserStreak["maxLength"];
    details: UserProfileDetails;
    allTimeLbs: {
      time: Record<string, Record<string, number | null>>;
    };
    personalBests: {
      time: Pick<
        Record<`${number}`, SharedTypes.PersonalBest[]>,
        "15" | "30" | "60" | "120"
      >;
      words: Pick<
        Record<`${number}`, SharedTypes.PersonalBest[]>,
        "10" | "25" | "50" | "100"
      >;
    };
  };
}
