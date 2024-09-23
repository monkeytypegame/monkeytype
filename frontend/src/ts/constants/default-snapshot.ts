import { deepClone } from "../utils/misc";
import defaultConfig from "./default-config";

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
  config: defaultConfig,
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
};

export default deepClone(defaultSnap);
