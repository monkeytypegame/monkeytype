type ObjectId = import("mongodb").ObjectId;

type ExpressRequest = import("express").Request;

declare namespace MonkeyTypes {
  type DecodedToken = {
    type: "Bearer" | "ApeKey" | "None";
    uid: string;
    email: string;
  };

  type Context = {
    configuration: SharedTypes.Configuration;
    decodedToken: DecodedToken;
  };

  type Request = {
    ctx: Readonly<Context>;
  } & ExpressRequest;

  // Data Model

  type UserProfileDetails = {
    bio?: string;
    keyboard?: string;
    socialProfiles: {
      twitter?: string;
      github?: string;
      website?: string;
    };
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
    item: Badge;
  } & Reward<Badge>;

  type AllRewards = XpReward | BadgeReward;

  type MonkeyMail = {
    id: string;
    subject: string;
    body: string;
    timestamp: number;
    read: boolean;
    rewards: AllRewards[];
  };

  type UserIpHistory = string[];

  type User = {
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
  };

  type UserStreak = {
    lastResultTimestamp: number;
    length: number;
    maxLength: number;
    hourOffset?: number;
  };

  type UserInventory = {
    badges: Badge[];
  };

  type Badge = {
    id: number;
    selected?: boolean;
    important?: boolean;
  };

  type UserQuoteRatings = Record<string, Record<string, number>>;

  type LbPersonalBests = {
    time: Record<number, Record<string, SharedTypes.PersonalBest>>;
  };

  type WithObjectId<T extends { _id: string }> = Omit<T, "_id"> & {
    _id: ObjectId;
  };

  type WithObjectIdArray<T extends { _id: string }[]> = Omit<T, "_id"> &
    {
      _id: ObjectId;
    }[];

  type UserTag = {
    _id: ObjectId;
    name: string;
    personalBests: SharedTypes.PersonalBests;
  };

  type CustomTheme = {
    _id: ObjectId;
    name: string;
    colors: string[];
  };

  type ApeKeyDB = SharedTypes.ApeKey & {
    _id: ObjectId;
    uid: string;
    hash: string;
    useCount: number;
  };

  type NewQuote = {
    _id: ObjectId;
    text: string;
    source: string;
    language: string;
    submittedBy: string;
    timestamp: number;
    approved: boolean;
  };

  type ReportTypes = "quote" | "user";

  type Report = {
    _id: ObjectId;
    id: string;
    type: ReportTypes;
    timestamp: number;
    uid: string;
    contentId: string;
    reason: string;
    comment: string;
  };

  type QuoteRating = {
    _id: string;
    average: number;
    language: string;
    quoteId: number;
    ratings: number;
    totalRating: number;
  };

  type FunboxMetadata = {
    name: string;
    canGetPb: boolean;
    difficultyLevel: number;
    properties?: string[];
    frontendForcedConfig?: Record<string, string[] | boolean[]>;
    frontendFunctions?: string[];
  };

  type PremiumInfo = {
    startTimestamp: number;
    expirationTimestamp: number;
  };
}
