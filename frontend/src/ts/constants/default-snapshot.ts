import {
  ResultFilters,
  User,
  UserProfileDetails,
  UserTag,
} from "@monkeytype/contracts/schemas/users";
import { deepClone } from "../utils/misc";
import { getDefaultConfig } from "./default-config";
import { Mode } from "@monkeytype/contracts/schemas/shared";
import { Result } from "@monkeytype/contracts/schemas/results";
import { Config, FunboxName } from "@monkeytype/contracts/schemas/configs";
import {
  ModifiableTestActivityCalendar,
  TestActivityCalendar,
} from "../elements/test-activity-calendar";
import { Preset } from "@monkeytype/contracts/schemas/presets";
import { Language } from "@monkeytype/contracts/schemas/languages";

export type SnapshotUserTag = UserTag & {
  active?: boolean;
  display: string;
};

export type SnapshotResult<M extends Mode> = Omit<
  Result<M>,
  | "_id"
  | "bailedOut"
  | "blindMode"
  | "lazyMode"
  | "difficulty"
  | "funbox"
  | "language"
  | "numbers"
  | "punctuation"
  | "quoteLength"
  | "restartCount"
  | "incompleteTestSeconds"
  | "afkDuration"
  | "tags"
> & {
  _id: string;
  bailedOut: boolean;
  blindMode: boolean;
  lazyMode: boolean;
  difficulty: string;
  funbox: FunboxName[];
  language: Language;
  numbers: boolean;
  punctuation: boolean;
  quoteLength: number;
  restartCount: number;
  incompleteTestSeconds: number;
  afkDuration: number;
  tags: string[];
};

export type Snapshot = Omit<
  User,
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
  details?: UserProfileDetails;
  inboxUnreadSize: number;
  streak: number;
  maxStreak: number;
  filterPresets: ResultFilters[];
  isPremium: boolean;
  streakHourOffset?: number;
  config: Config;
  tags: SnapshotUserTag[];
  presets: SnapshotPreset[];
  results?: SnapshotResult<Mode>[];
  xp: number;
  testActivity?: ModifiableTestActivityCalendar;
  testActivityByYear?: { [key: string]: TestActivityCalendar };
};

export type SnapshotPreset = Preset & {
  display: string;
};

const defaultSnap = {
  results: undefined,
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
  customThemes: [],
  presets: [],
  tags: [],
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
  filterPresets: [],
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
} as Snapshot;

export function getDefaultSnapshot(): Snapshot {
  return deepClone(defaultSnap);
}
