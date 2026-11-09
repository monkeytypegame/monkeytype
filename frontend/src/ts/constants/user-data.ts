import {
  TestActivity,
  User,
  UserProfileDetails,
} from "@monkeytype/schemas/users";
import { getDefaultConfig } from "./default-config";

export type UserData = Omit<
  User,
  | "timeTyping"
  | "startedTests"
  | "completedTests"
  | "profileDetails"
  | "streak"
  | "resultFilterPresets"
  | "tags"
  | "customThemes"
  | "xp"
  | "testActivity"
> & {
  typingStats: {
    timeTyping: number;
    startedTests: number;
    completedTests: number;
  };
  details?: UserProfileDetails;
  inboxUnreadSize: number;
  streak: number;
  maxStreak: number;
  isPremium: boolean;
  streakHourOffset?: number;
  xp: number;
  testActivity?: TestActivity;
};

const defaultSnap = {
  personalBests: {
    time: {},
    words: {},
    quote: {},
    zen: {},
    custom: {},
  },
  name: "",
  email: "",
  uid: "",
  isPremium: false,
  config: getDefaultConfig(),
  banned: undefined,
  verified: undefined,
  lbMemory: { time: { 15: { english: 0 }, 60: { english: 0 } } },
  typingStats: {
    timeTyping: 0,
    startedTests: 0,
    completedTests: 0,
  },
  quoteRatings: undefined,
  quoteMod: false,
  favoriteQuotes: {},
  addedAt: 0,
  xp: 0,
  inboxUnreadSize: 0,
  streak: 0,
  maxStreak: 0,
  streakHourOffset: undefined,
  allTimeLbs: {
    time: {
      15: { english: { count: 0, rank: 0 } },
      60: { english: { count: 0, rank: 0 } },
    },
  },
} as UserData;

export function getDefaultUserData(): UserData {
  return structuredClone(defaultSnap);
}
