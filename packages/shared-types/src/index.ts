type Difficulty = import("@monkeytype/contracts/schemas/configs").Difficulty;
type Mode = import("@monkeytype/contracts/schemas/shared").Mode;
type Mode2<M extends Mode> =
  import("@monkeytype/contracts/schemas/shared").Mode2<M>;
type PersonalBest = import("@monkeytype/contracts/schemas/shared").PersonalBest;
type PersonalBests =
  import("@monkeytype/contracts/schemas/shared").PersonalBests;

export type ValidModeRule = {
  language: string;
  mode: string;
  mode2: string;
};
export type RewardBracket = {
  minRank: number;
  maxRank: number;
  minReward: number;
  maxReward: number;
};

export type Configuration = {
  maintenance: boolean;
  dev: {
    responseSlowdownMs: number;
  };
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
};

export type IncompleteTest = {
  acc: number;
  seconds: number;
};

export type ChartData = {
  wpm: number[];
  raw: number[];
  err: number[];
};

export type KeyStats = {
  average: number;
  sd: number;
};

export type Result<M extends Mode> = {
  _id: string;
  wpm: number;
  rawWpm: number;
  charStats: [number, number, number, number];
  acc: number;
  mode: M;
  mode2: Mode2<M>;
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
  difficulty: Difficulty;
  funbox: string;
  language: string;
  numbers: boolean;
  punctuation: boolean;
};

export type DBResult<T extends Mode> = Omit<
  Result<T>,
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
  difficulty?: Difficulty;
  funbox?: string;
  language?: string;
  numbers?: boolean;
  punctuation?: boolean;
  restartCount?: number;
  incompleteTestSeconds?: number;
  afkDuration?: number;
  tags?: string[];
  customText?: CustomTextDataWithTextLen;
  quoteLength?: number;
  isPb?: boolean;
};

export type CompletedEvent = Result<Mode> & {
  keySpacing: number[] | "toolong";
  keyDuration: number[] | "toolong";
  customText?: CustomTextDataWithTextLen;
  wpmConsistency: number;
  challenge?: string | null;
  keyOverlap: number;
  lastKeyToEnd: number;
  startToFirstKey: number;
  charTotal: number;
  stringified?: string;
  hash?: string;
  stopOnLetter: boolean;
};

export type CustomTextMode = "repeat" | "random" | "shuffle";
export type CustomTextLimitMode = "word" | "time" | "section";
export type CustomTextLimit = {
  value: number;
  mode: CustomTextLimitMode;
};

export type CustomTextData = {
  text: string[];
  mode: CustomTextMode;
  limit: CustomTextLimit;
  pipeDelimiter: boolean;
};

export type CustomTextDataWithTextLen = Omit<CustomTextData, "text"> & {
  textLen: number;
};

export type ResultFilters = {
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
};

export type LeaderboardEntry = {
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
  badgeId?: number;
  isPremium?: boolean;
};

export type PostResultResponse = {
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

export type UserStreak = {
  lastResultTimestamp: number;
  length: number;
  maxLength: number;
  hourOffset?: number;
};

export type UserTag = {
  _id: string;
  name: string;
  personalBests: PersonalBests;
};

export type UserProfileDetails = {
  bio?: string;
  keyboard?: string;
  socialProfiles: {
    twitter?: string;
    github?: string;
    website?: string;
  };
};

export type CustomTheme = {
  _id: string;
  name: string;
  colors: import("@monkeytype/contracts/schemas/configs").CustomThemeColors;
};

export type PremiumInfo = {
  startTimestamp: number;
  expirationTimestamp: number;
};

export type UserQuoteRatings = Record<string, Record<string, number>>;

export type UserLbMemory = Record<
  string,
  Record<string, Record<string, number>>
>;

export type UserInventory = {
  badges: Badge[];
};

export type Badge = {
  id: number;
  selected?: boolean;
};

export type User = {
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
  isPremium?: boolean;
  quoteRatings?: UserQuoteRatings;
  favoriteQuotes?: Record<string, string[]>;
  lbMemory?: UserLbMemory;
  allTimeLbs: AllTimeLbs;
  inventory?: UserInventory;
  banned?: boolean;
  lbOptOut?: boolean;
  verified?: boolean;
  needsToChangeName?: boolean;
  quoteMod?: boolean | string;
  resultFilterPresets?: ResultFilters[];
  testActivity?: TestActivity;
};

export type Reward<T> = {
  type: string;
  item: T;
};

export type XpReward = {
  type: "xp";
  item: number;
} & Reward<number>;

export type BadgeReward = {
  type: "badge";
  item: Badge;
} & Reward<Badge>;

export type AllRewards = XpReward | BadgeReward;

export type MonkeyMail = {
  id: string;
  subject: string;
  body: string;
  timestamp: number;
  read: boolean;
  rewards: AllRewards[];
};

export type UserProfile = Pick<
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
  | "isPremium"
  | "allTimeLbs"
> & {
  typingStats: {
    completedTests: User["completedTests"];
    startedTests: User["startedTests"];
    timeTyping: User["timeTyping"];
  };
  streak: UserStreak["length"];
  maxStreak: UserStreak["maxLength"];
  details: UserProfileDetails;
  personalBests: {
    time: Pick<Record<`${number}`, PersonalBest[]>, "15" | "30" | "60" | "120">;
    words: Pick<
      Record<`${number}`, PersonalBest[]>,
      "10" | "25" | "50" | "100"
    >;
  };
};

export type AllTimeLbs = {
  time: Record<string, Record<string, RankAndCount | undefined>>;
};

export type RankAndCount = {
  rank?: number;
  count: number;
};

export type TestActivity = {
  testsByDays: (number | null)[];
  lastDay: number;
};

export type CountByYearAndDay = { [key: string]: (number | null)[] };
