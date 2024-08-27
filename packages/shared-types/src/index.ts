type PersonalBest = import("@monkeytype/contracts/schemas/shared").PersonalBest;
type PersonalBests =
  import("@monkeytype/contracts/schemas/shared").PersonalBests;

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

//replaced
export type UserStreak = {
  lastResultTimestamp: number;
  length: number;
  maxLength: number;
  hourOffset?: number;
};

//replaced
export type UserTag = {
  _id: string;
  name: string;
  personalBests: PersonalBests;
};

//replaced
export type UserProfileDetails = {
  bio?: string;
  keyboard?: string;
  socialProfiles: {
    twitter?: string;
    github?: string;
    website?: string;
  };
};

//replaced
export type CustomTheme = {
  _id: string;
  name: string;
  colors: import("@monkeytype/contracts/schemas/configs").CustomThemeColors;
};

//replaced
export type PremiumInfo = {
  startTimestamp: number;
  expirationTimestamp: number;
};

//replaced (quotespr)
export type UserQuoteRatings = Record<string, Record<string, number>>;

//replaced
export type UserLbMemory = Record<
  string,
  Record<string, Record<string, number>>
>;

//replaced
export type UserInventory = {
  badges: Badge[];
};

//repaced
export type Badge = {
  id: number;
  selected?: boolean;
};

//replaced
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
  favoriteQuotes?: Record<string, string[]>; //Record<language, array with quoteIds as string
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

//replaced
export type Reward<T> = {
  type: string;
  item: T;
};

//replaced
export type XpReward = {
  type: "xp";
  item: number;
} & Reward<number>;

//replaced
export type BadgeReward = {
  type: "badge";
  item: Badge;
} & Reward<Badge>;

//replaced
export type AllRewards = XpReward | BadgeReward;

//replaced
export type MonkeyMail = {
  id: string;
  subject: string;
  body: string;
  timestamp: number;
  read: boolean;
  rewards: AllRewards[];
};

//replaced
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

//replaced
export type AllTimeLbs = {
  time: Record<string, Record<string, RankAndCount | undefined>>;
};

//unused
export type RankAndCount = {
  rank?: number;
  count: number;
};

//replaced
export type TestActivity = {
  testsByDays: (number | null)[];
  lastDay: number;
};

//replaced
export type CountByYearAndDay = { [key: string]: (number | null)[] };
