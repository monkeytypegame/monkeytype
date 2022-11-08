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
    filterPresets: {
      enabled: false,
      maxPresetsPerUser: 0,
    },
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
  users: {
    signUp: false,
    discordIntegration: {
      enabled: false,
    },
    autoBan: {
      enabled: false,
      maxCount: 5,
      maxHours: 1,
    },
    profiles: {
      enabled: false,
    },
    xp: {
      enabled: false,
      gainMultiplier: 0,
      maxDailyBonus: 0,
      minDailyBonus: 0,
      streak: {
        enabled: false,
        maxStreakDays: 0,
        maxStreakMultiplier: 0,
      },
    },
    inbox: {
      enabled: false,
      maxMail: 0,
    },
  },
  rateLimiting: {
    badAuthentication: {
      enabled: false,
      penalty: 0,
      flaggedStatusCodes: [],
    },
  },
  dailyLeaderboards: {
    enabled: false,
    maxResults: 0,
    leaderboardExpirationTimeInDays: 0,
    validModeRules: [],
    // GOTCHA! MUST ATLEAST BE 1, LRUCache module will make process crash and die
    dailyLeaderboardCacheSize: 1,
    topResultsToAnnounce: 1, // This should never be 0. Setting to zero will announce all results.
    xpRewardBrackets: [],
  },
};

interface BaseSchema {
  type: string;
  label?: string;
}

interface NumberSchema extends BaseSchema {
  type: "number";
  min?: number;
}

interface BooleanSchema extends BaseSchema {
  type: "boolean";
}

interface StringSchema extends BaseSchema {
  type: "string";
}

interface ArraySchema extends BaseSchema {
  type: "array";
  items: Schema;
}

interface ObjectSchema extends BaseSchema {
  type: "object";
  fields: Record<string, Schema>;
}

type Schema =
  | ObjectSchema
  | ArraySchema
  | StringSchema
  | NumberSchema
  | BooleanSchema;

export const CONFIGURATION_FORM_SCHEMA: ObjectSchema = {
  type: "object",
  label: "Server Configuration",
  fields: {
    maintenance: {
      type: "boolean",
      label: "In Maintenance",
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
        filterPresets: {
          type: "object",
          label: "Filter Presets",
          fields: {
            enabled: {
              type: "boolean",
              label: "Enabled",
            },
            maxPresetsPerUser: {
              type: "number",
              label: "Max Presets Per User",
              min: 0,
            },
          },
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
    users: {
      type: "object",
      label: "Users",
      fields: {
        signUp: {
          type: "boolean",
          label: "Sign Up Enabled",
        },
        xp: {
          type: "object",
          label: "XP",
          fields: {
            enabled: {
              type: "boolean",
              label: "Enabled",
            },
            gainMultiplier: {
              type: "number",
              label: "Gain Multiplier",
            },
            maxDailyBonus: {
              type: "number",
              label: "Max Daily Bonus",
            },
            minDailyBonus: {
              type: "number",
              label: "Min Daily Bonus",
            },
            streak: {
              type: "object",
              label: "Streak",
              fields: {
                enabled: {
                  type: "boolean",
                  label: "Enabled",
                },
                maxStreakDays: {
                  type: "number",
                  label: "Max Streak Days",
                },
                maxStreakMultiplier: {
                  type: "number",
                  label: "Max Streak Multiplier",
                },
              },
            },
          },
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
        inbox: {
          type: "object",
          label: "Inbox",
          fields: {
            enabled: {
              type: "boolean",
              label: "Enabled",
            },
            maxMail: {
              type: "number",
              label: "Max Messages",
              min: 0,
            },
          },
        },
        profiles: {
          type: "object",
          label: "User Profiles",
          fields: {
            enabled: {
              type: "boolean",
              label: "Enabled",
            },
          },
        },
      },
    },
    rateLimiting: {
      type: "object",
      label: "Rate Limiting",
      fields: {
        badAuthentication: {
          type: "object",
          label: "Bad Authentication Rate Limiter",
          fields: {
            enabled: {
              type: "boolean",
              label: "Enabled",
            },
            penalty: {
              type: "number",
              label: "Penalty",
              min: 0,
            },
            flaggedStatusCodes: {
              type: "array",
              label: "Flagged Status Codes",
              items: {
                label: "Status Code",
                type: "number",
                min: 0,
              },
            },
          },
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
        xpRewardBrackets: {
          type: "array",
          label: "XP Reward Brackets",
          items: {
            type: "object",
            label: "Bracket",
            fields: {
              minRank: {
                type: "number",
                label: "Min Rank",
                min: 1,
              },
              maxRank: {
                type: "number",
                label: "Max Rank",
                min: 1,
              },
              minReward: {
                type: "number",
                label: "Min Reward",
                min: 0,
              },
              maxReward: {
                type: "number",
                label: "Max Reward",
                min: 0,
              },
            },
          },
        },
      },
    },
  },
};
