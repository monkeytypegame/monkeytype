/**
 * This is the base schema for the configuration of the API backend.
 * To add a new configuration. Simply add it to this object.
 * When changing this template, please follow the principle of "Secure by default" (https://en.wikipedia.org/wiki/Secure_by_default).
 */
export const BASE_CONFIGURATION: MonkeyTypes.Configuration = {
  maintenance: false,
  results: {
    savingEnabled: false,
    objectHashCheckEnabled: false,
  },
  quotes: {
    reporting: {
      enabled: false,
      maxReports: 0,
      contentReportLimit: 0,
    },
    submissionsEnabled: false,
    maxFavorites: 0,
  },
  apeKeys: {
    endpointsEnabled: false,
    acceptKeys: false,
    maxKeysPerUser: 0,
    apeKeyBytes: 24,
    apeKeySaltRounds: 5,
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
  discordIntegration: {
    enabled: false,
  },
  customFilters: {
    enabled: true,
    maxFiltersPerUser: 0,
  },
};

export const CONFIGURATION_FORM_SCHEMA = {
  type: "object",
  label: "Server Configuration",
  fields: {
    maintenance: {
      type: "boolean",
      label: "In Maintenance",
    },
    discordIntegration: {
      type: "object",
      label: "Discord Integration",
      fields: {
        enabled: {
          type: "boolean",
          label: "Enabled",
        },
      },
    },
    results: {
      type: "object",
      label: "Results",
      fields: {
        savingEnabled: {
          type: "boolean",
          label: "Saving Results",
        },
        objectHashCheckEnabled: {
          type: "boolean",
          label: "Object Hash Check",
        },
      },
    },
    quotes: {
      type: "object",
      label: "Quotes",
      fields: {
        reporting: {
          type: "object",
          label: "Reporting",
          fields: {
            enabled: {
              type: "boolean",
              label: "Enabled",
            },
            maxReports: {
              type: "number",
              label: "Max Reports",
            },
            contentReportLimit: {
              type: "number",
              label: "Content Report Limit",
            },
          },
        },
        submissionsEnabled: {
          type: "boolean",
          label: "Submissions Enabled",
        },
        maxFavorites: {
          type: "number",
          label: "Max Favorites",
        },
      },
    },
    apeKeys: {
      type: "object",
      label: "Ape Keys",
      fields: {
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
    autoBan: {
      type: "object",
      label: "Auto Ban",
      fields: {
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
      type: "object",
      label: "Daily Leaderboards",
      fields: {
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
          items: {
            type: "object",
            label: "Rule",
            fields: {
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
    customFilters: {
      type: "object",
      label: "Custom Filters",
      fields: {
        enabled: {
          type: "boolean",
          label: "Enabled",
        },
        maxFiltersPerUser: {
          type: "number",
          label: "Max Filters per user",
          min: 0,
        },
      },
    },
  },
};
