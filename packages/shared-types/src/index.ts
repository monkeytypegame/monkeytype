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

export type CustomTextLimit = {
  value: number;
  mode: import("@monkeytype/contracts/schemas/util").CustomTextLimitMode;
};

export type CustomTextData = Omit<
  import("@monkeytype/contracts/schemas/results").CustomTextDataWithTextLen,
  "textLen"
> & {
  text: string[];
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
  resultFilterPresets?: import("@monkeytype/contracts/schemas/users").ResultFilters[];
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
