/**
 * This is the base schema for the configuration of the API backend.
 * To add a new configuration. Simply add it to this object.
 * When changing this template, please follow the principle of "Secure by default" (https://en.wikipedia.org/wiki/Secure_by_default).
 */
const BASE_CONFIGURATION: MonkeyTypes.Configuration = {
  maintenance: false,
  quoteReport: {
    enabled: false,
    maxReports: 0,
    contentReportLimit: 0,
  },
  quoteSubmit: {
    enabled: false,
  },
  resultObjectHashCheck: {
    enabled: false,
  },
  apeKeys: {
    endpointsEnabled: false,
    acceptKeys: false,
    maxKeysPerUser: 0,
    apeKeyBytes: 24,
    apeKeySaltRounds: 5,
  },
  enableSavingResults: {
    enabled: false,
  },
  favoriteQuotes: {
    maxFavorites: 0,
  },
  autoBan: {
    enabled: false,
    maxCount: 5,
    maxHours: 1,
  },
  dailyLeaderboards: {
    enabled: false,
    maxResults: 0,
    leaderboardExpirationTimeInDays: 0,
    validModeRules: [],
    // GOTCHA! MUST ATLEAST BE 1, LRUCache module will make process crash and die
    dailyLeaderboardCacheSize: 1,
    topResultsToAnnounce: 1, // This should never be 0. Setting to zero will announce all results.
  },
};

export default BASE_CONFIGURATION;
