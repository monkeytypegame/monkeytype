import {
  ResultFilters,
  User,
  UserProfileDetails,
  UserTag,
} from "@monkeytype/schemas/users";
import { getDefaultConfig } from "./default-config";
import { Mode } from "@monkeytype/schemas/shared";
import { Result } from "@monkeytype/schemas/results";
import { Difficulty, FunboxName } from "@monkeytype/schemas/configs";
import {
  ModifiableTestActivityCalendar,
  TestActivityCalendar,
} from "../elements/test-activity-calendar";
import { Preset } from "@monkeytype/schemas/presets";
import { Language } from "@monkeytype/schemas/languages";
import { ConnectionStatus } from "@monkeytype/schemas/connections";

export type SnapshotUserTag = UserTag & {
  active?: boolean;
  display: string;
};

export type SnapshotResult<M extends Mode> = Omit<
  Result<M>,
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
  bailedOut: boolean;
  blindMode: boolean;
  lazyMode: boolean;
  difficulty: Difficulty;
  funbox: FunboxName[];
  language: Language;
  numbers: boolean;
  punctuation: boolean;
  quoteLength: number;
  restartCount: number;
  incompleteTestSeconds: number;
  afkDuration: number;
  tags: string[];
  words: number;
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
  tags: SnapshotUserTag[];
  presets: SnapshotPreset[];
  results?: SnapshotResult<Mode>[];
  xp: number;
  testActivity?: ModifiableTestActivityCalendar;
  testActivityByYear?: { [key: string]: TestActivityCalendar };
  connections: Record<string, ConnectionStatus | "incoming">;
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
  connections: {},
} as Snapshot;

export function getDefaultSnapshot(): Snapshot {
  return structuredClone(defaultSnap);
}
