type ObjectId = import("mongodb").ObjectId;

type ExpressRequest = import("express").Request;

declare namespace MonkeyTypes {
  interface ValidModeRule {
    language: string;
    mode: string;
    mode2: string;
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
    };
    users: {
      signUp: boolean;
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
      dailyLeaderboardCacheSize: number;
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

  interface RewardBracket {
    minRank: number;
    maxRank: number;
    minReward: number;
    maxReward: number;
  }

  interface DecodedToken {
    type: "Bearer" | "ApeKey" | "None";
    uid: string;
    email: string;
  }

  interface Context {
    configuration: Configuration;
    decodedToken: DecodedToken;
  }

  interface Request extends ExpressRequest {
    ctx: Readonly<Context>;
  }

  // Data Model

  interface UserProfileDetails {
    bio?: string;
    keyboard?: string;
    socialProfiles: {
      twitter?: string;
      github?: string;
      website?: string;
    };
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

  interface MonkeyMail {
    id: string;
    subject: string;
    body: string;
    timestamp: number;
    read: boolean;
    rewards: AllRewards[];
  }

  interface User {
    autoBanTimestamps?: number[];
    addedAt: number;
    verified?: boolean;
    bananas?: number;
    completedTests?: number;
    discordId?: string;
    email: string;
    lastNameChange?: number;
    lbMemory?: object;
    lbPersonalBests?: LbPersonalBests;
    name: string;
    customThemes?: CustomTheme[];
    personalBests?: PersonalBests;
    quoteRatings?: UserQuoteRatings;
    startedTests?: number;
    tags?: UserTag[];
    timeTyping?: number;
    uid: string;
    quoteMod?: boolean;
    cannotReport?: boolean;
    banned?: boolean;
    canManageApeKeys?: boolean;
    favoriteQuotes?: Record<string, string[]>;
    needsToChangeName?: boolean;
    discordAvatar?: string;
    resultFilterPresets?: ResultFilters[];
    profileDetails?: UserProfileDetails;
    inventory?: UserInventory;
    xp?: number;
    inbox?: MonkeyMail[];
    streak?: UserStreak;
  }

  interface UserStreak {
    lastResultTimestamp: number;
    length: number;
    maxLength: number;
  }

  interface UserInventory {
    badges: Badge[];
  }

  interface Badge {
    id: number;
    selected?: boolean;
  }

  interface ResultFilters {
    _id: ObjectId;
    name: string;
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
      custom: boolean;
    };
    time: {
      15: boolean;
      30: boolean;
      60: boolean;
      120: boolean;
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

  type UserQuoteRatings = Record<string, Record<string, number>>;

  interface LbPersonalBests {
    time: {
      [key: number]: {
        [key: string]: PersonalBest;
      };
    };
  }

  interface UserTag {
    _id: ObjectId;
    name: string;
    personalBests?: PersonalBests;
  }

  interface LeaderboardEntry {
    _id: ObjectId;
    acc: number;
    consistency: number;
    difficulty: Difficulty;
    lazyMode: boolean;
    language: string;
    punctuation: boolean;
    raw: number;
    wpm: number;
    timestamp: number;
    uid: string;
    name: string;
    rank: number;
    badges?: Badge[];
    badgeId?: number;
  }

  interface CustomTheme {
    _id: ObjectId;
    name: string;
    colors: string[];
  }

  interface ApeKey {
    _id: ObjectId;
    uid: string;
    name: string;
    hash: string;
    createdOn: number;
    modifiedOn: number;
    lastUsedOn: number;
    useCount: number;
    enabled: boolean;
  }

  interface NewQuote {
    _id: ObjectId;
    text: string;
    source: string;
    language: string;
    submittedBy: string;
    timestamp: number;
    approved: boolean;
  }

  type Mode = "time" | "words" | "quote" | "zen" | "custom";

  type Mode2<M extends Mode> = keyof PersonalBests[M];

  type Difficulty = "normal" | "expert" | "master";

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
    };
    words: {
      [key: number]: PersonalBest[];
    };
    quote: { [quote: string]: PersonalBest[] };
    custom: { custom?: PersonalBest[] };
    zen: {
      zen?: PersonalBest[];
    };
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

  interface IncompleteTest {
    acc: number;
    seconds: number;
  }

  interface Result<M extends Mode> {
    _id: ObjectId;
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

  interface CompletedEvent extends MonkeyTypes.Result<MonkeyTypes.Mode> {
    keySpacing: number[] | "toolong";
    keyDuration: number[] | "toolong";
    customText: MonkeyTypes.CustomText;
    wpmConsistency: number;
    lang: string;
    challenge?: string | null;
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

  interface PSA {
    sticky?: boolean;
    message: string;
    level?: number;
  }

  type ReportTypes = "quote";

  interface Report {
    _id: ObjectId;
    id: string;
    type: ReportTypes;
    timestamp: number;
    uid: string;
    contentId: string;
    reason: string;
    comment: string;
  }

  interface PublicStats {
    _id: string;
    testsCompleted: number;
    testsStarted: number;
    timeTyping: number;
    type: string;
  }

  interface PublicSpeedStats {
    _id: string;
    type: "speedStats";
    [language_mode_mode2: string]: Record<string, number>;
  }

  interface QuoteRating {
    _id: string;
    average: number;
    language: string;
    quoteId: number;
    ratings: number;
    totalRating: number;
  }

  interface FunboxMetadata {
    canGetPb: boolean;
    difficultyLevel: number;
  }
}
