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

  type Difficulty = "normal" | "expert" | "master";

  type Mode = keyof PersonalBests;

  type Mode2<M extends Mode> = M extends M ? keyof PersonalBests[M] : never;

  type StringNumber = `${number}`;

  type Mode2Custom<M extends Mode> = Mode2<M> | "custom";

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

  interface Result<M extends Mode> {
    _id: string;
    wpm: number;
    rawWpm: number;
    charStats: number[];
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

  type WithObjectId<T extends { _id: string }> = Omit<T, "_id"> & {
    _id: ObjectId;
  };

  type DBResult<T extends SharedTypes.Mode> = WithObjectId<
    Omit<
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
    > & {
      correctChars?: number; // --------------
      incorrectChars?: number; // legacy results
      // --------------
      name: string;
      // -------------- fields that might be removed to save space
      bailedOut?: boolean;
      blindMode?: boolean;
      lazyMode?: boolean;
      difficulty?: SharedTypes.Difficulty;
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
    }
  >;

  interface CompletedEvent extends Result<Mode> {
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
}
