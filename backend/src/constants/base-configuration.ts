/**
 * This is the base schema for the configuration of the API backend.
 * To add a new configuration. Simply add it to this object.
 * When changing this template, please follow the principle of "Secure by default" (https://en.wikipedia.org/wiki/Secure_by_default).
 */
export const BASE_CONFIGURATION: MonkeyTypes.Configuration = {
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

export const CONFIGURATION_FORM_SCHEMA = {
  type: "group",
  label: "Server Configuration",
  elements: {
    maintenance: {
      type: "boolean",
      label: "In Maintenance",
    },
    quoteReport: {
      type: "group",
      label: "Quote Reporting",
      elements: {
        enabled: {
          type: "boolean",
          label: "Enabled",
        },
        maxReports: {
          type: "number",
          label: "Max Reports",
          min: 0,
        },
        contentReportLimit: {
          type: "number",
          label: "Content Report Limit",
          min: 0,
        },
      },
    },
    quoteSubmit: {
      type: "group",
      label: "Quote Submission",
      elements: {
        enabled: {
          type: "boolean",
          label: "Enabled",
        },
      },
    },
    resultObjectHashCheck: {
      type: "group",
      label: "Result Object Hash Check",
      elements: {
        enabled: {
          type: "boolean",
          label: "Enabled",
        },
      },
    },
    apeKeys: {
      type: "group",
      label: "Ape Keys",
      elements: {
        endpointsEnabled: {
          type: "boolean",
          label: "Endpoints Enabled",
        },
        acceptKeys: {
          type: "boolean",
          label: "Accept Keys",
        },
        maxKeysPerUser: {
          type: "number",
          label: "Max Keys Per User",
          min: 0,
        },
        apeKeyBytes: {
          type: "number",
          label: "Ape Key Bytes",
          min: 24,
        },
        apeKeySaltRounds: {
          type: "number",
          label: "Ape Key Salt Rounds",
          min: 5,
        },
      },
    },
    enableSavingResults: {
      type: "group",
      label: "Saving Results",
      elements: {
        enabled: {
          type: "boolean",
          label: "Enabled",
        },
      },
    },
    favoriteQuotes: {
      type: "group",
      label: "Favorite Quotes",
      elements: {
        maxFavorites: {
          type: "number",
          label: "Max Favorites",
          min: 0,
        },
      },
    },
    autoBan: {
      type: "group",
      label: "Auto Ban",
      elements: {
        enabled: {
          type: "boolean",
          label: "Enabled",
        },
        maxCount: {
          type: "number",
          label: "Max Count",
          min: 0,
        },
        maxHours: {
          type: "number",
          label: "Max Hours",
          min: 0,
        },
      },
    },
    dailyLeaderboards: {
      type: "group",
      label: "Daily Leaderboards",
      elements: {
        enabled: {
          type: "boolean",
          label: "Enabled",
        },
        maxResults: {
          type: "number",
          label: "Max Results",
          min: 0,
        },
        leaderboardExpirationTimeInDays: {
          type: "number",
          label: "Leaderboard Expiration Time In Days",
          min: 0,
        },
        validModeRules: {
          type: "array",
          label: "Valid Mode Rules",
          elements: {
            type: "group",
            elements: {
              language: {
                type: "string",
                label: "Language",
              },
              mode: {
                type: "string",
                label: "Mode",
              },
              mode2: {
                type: "string",
                label: "Secondary Mode",
              },
            },
          },
        },
        dailyLeaderboardCacheSize: {
          type: "number",
          label: "Daily Leaderboard Cache Size",
          min: 1,
        },
        topResultsToAnnounce: {
          type: "number",
          label: "Top Results To Announce",
          min: 1,
        },
      },
    },
  },
};
