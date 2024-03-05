/**
 * This is the base schema for the configuration of the API backend.
 * To add a new configuration. Simply add it to this object.
 * When changing this template, please follow the principle of "Secure by default" (https://en.wikipedia.org/wiki/Secure_by_default).
 */
export const BASE_CONFIGURATION: SharedTypes.Configuration = {
  maintenance: false,
  results: {
    savingEnabled: false,
    objectHashCheckEnabled: false,
    filterPresets: {
      enabled: false,
      maxPresetsPerUser: 0,
    },
    limits: {
      regularUser: 1000,
      premiumUser: 10000,
    },
    maxBatchSize: 1000,
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
  admin: {
    endpointsEnabled: false,
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
    lastHashesCheck: {
      enabled: false,
      maxHashes: 0,
    },
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
      funboxBonus: 0,
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
    premium: {
      enabled: false,
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
    scheduleRewardsModeRules: [],
    topResultsToAnnounce: 1, // This should never be 0. Setting to zero will announce all results.
    xpRewardBrackets: [],
  },
  leaderboards: {
    weeklyXp: {
      enabled: false,
      expirationTimeInDays: 0, // This should atleast be 15
      xpRewardBrackets: [],
    },
  },
};

type BaseSchema = {
  type: string;
  label?: string;
  hint?: string;
};

type NumberSchema = {
  type: "number";
  min?: number;
} & BaseSchema;

type BooleanSchema = {
  type: "boolean";
} & BaseSchema;

type StringSchema = {
  type: "string";
} & BaseSchema;

type ArraySchema<T extends unknown[]> = {
  type: "array";
  items: Schema<T>[number];
} & BaseSchema;

type ObjectSchema<T> = {
  type: "object";
  fields: Schema<T>;
} & BaseSchema;

type Schema<T> = {
  [P in keyof T]: T[P] extends unknown[]
    ? ArraySchema<T[P]>
    : T[P] extends number
    ? NumberSchema
    : T[P] extends boolean
    ? BooleanSchema
    : T[P] extends string
    ? StringSchema
    : T[P] extends object
    ? ObjectSchema<T[P]>
    : never;
};

export const CONFIGURATION_FORM_SCHEMA: ObjectSchema<SharedTypes.Configuration> =
  {
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
          limits: {
            type: "object",
            label: "maximum results",
            fields: {
              regularUser: {
                type: "number",
                label: "for regular users",
                min: 0,
              },
              premiumUser: {
                type: "number",
                label: "for premium users",
                min: 0,
              },
            },
          },
          maxBatchSize: {
            type: "number",
            label: "results endpoint max batch size",
            min: 1,
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
      admin: {
        type: "object",
        label: "Admin",
        fields: {
          endpointsEnabled: {
            type: "boolean",
            label: "Endpoints Enabled",
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
          premium: {
            type: "object",
            label: "Premium",
            fields: {
              enabled: {
                type: "boolean",
                label: "Enabled",
              },
            },
          },
          signUp: {
            type: "boolean",
            label: "Sign Up Enabled",
          },
          lastHashesCheck: {
            type: "object",
            label: "Last Hashes Check",
            fields: {
              enabled: { type: "boolean", label: "Enabled" },
              maxHashes: { type: "number", label: "Hashes to store" },
            },
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
              funboxBonus: {
                type: "number",
                label: "Funbox Bonus",
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
          scheduleRewardsModeRules: {
            type: "array",
            label: "Schedule Rewards Mode Rules",
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
          topResultsToAnnounce: {
            type: "number",
            label: "Top Results To Announce",
            min: 1,
            hint: "This should atleast be 1. Setting to zero is very bad.",
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
      leaderboards: {
        type: "object",
        label: "Leaderboards",
        fields: {
          weeklyXp: {
            type: "object",
            label: "Weekly XP",
            fields: {
              enabled: {
                type: "boolean",
                label: "Enabled",
              },
              expirationTimeInDays: {
                type: "number",
                label: "Expiration time in days",
                min: 0,
                hint: "This should atleast be 15, to allow for past week queries.",
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
      },
    },
  };
