type ObjectId = import("mongodb").ObjectId;

type ExpressRequest = import("express").Request;

declare namespace MonkeyTypes {
  interface DecodedToken {
    type: "Bearer" | "ApeKey" | "None";
    uid: string;
    email: string;
  }

  interface Context {
    configuration: SharedTypes.Configuration;
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

  type UserIpHistory = string[];

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
    personalBests: SharedTypes.PersonalBests;
    quoteRatings?: UserQuoteRatings;
    startedTests?: number;
    tags?: UserTag[];
    timeTyping?: number;
    uid: string;
    quoteMod?: boolean;
    configurationMod?: boolean;
    admin?: boolean;
    canReport?: boolean;
    banned?: boolean;
    canManageApeKeys?: boolean;
    favoriteQuotes?: Record<string, string[]>;
    needsToChangeName?: boolean;
    discordAvatar?: string;
    resultFilterPresets?: WithObjectIdArray<SharedTypes.ResultFilters[]>;
    profileDetails?: UserProfileDetails;
    inventory?: UserInventory;
    xp?: number;
    inbox?: MonkeyMail[];
    streak?: UserStreak;
    lastReultHashes?: string[];
    lbOptOut?: boolean;
    premium?: PremiumInfo;
    ips?: UserIpHistory;
  }

  interface UserStreak {
    lastResultTimestamp: number;
    length: number;
    maxLength: number;
    hourOffset?: number;
  }

  interface UserInventory {
    badges: Badge[];
  }

  interface Badge {
    id: number;
    selected?: boolean;
  }

  type UserQuoteRatings = Record<string, Record<string, number>>;

  interface LbPersonalBests {
    time: {
      [key: number]: {
        [key: string]: SharedTypes.PersonalBest;
      };
    };
  }

  type WithObjectId<T extends { _id: string }> = Omit<T, "_id"> & {
    _id: ObjectId;
  };

  type WithObjectIdArray<T extends { _id: string }[]> = Omit<T, "_id"> &
    {
      _id: ObjectId;
    }[];

  interface UserTag {
    _id: ObjectId;
    name: string;
    personalBests: SharedTypes.PersonalBests;
  }

  interface LeaderboardEntry {
    _id: ObjectId;
    acc: number;
    consistency: number;
    difficulty: SharedTypes.Difficulty;
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

  interface PSA {
    sticky?: boolean;
    message: string;
    level?: number;
  }

  type ReportTypes = "quote" | "user";

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
    _id: "stats";
    testsCompleted: number;
    testsStarted: number;
    timeTyping: number;
  }

  type PublicSpeedStats = PublicSpeedStatsMongoEntry &
    PublicSpeedStatsByLanguage;
  interface PublicSpeedStatsMongoEntry {
    _id: "speedStatsHistogram";
  }
  interface PublicSpeedStatsByLanguage {
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
    name: string;
    canGetPb: boolean;
    difficultyLevel: number;
    properties?: string[];
    frontendForcedConfig?: Record<string, string[] | boolean[]>;
    frontendFunctions?: string[];
  }

  interface PremiumInfo {
    startTimestamp: number;
    expirationTimestamp: number;
  }
}
