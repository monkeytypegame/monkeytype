import { it, expect, describe } from "vitest";
import {
  ValidModeRuleSchema,
  RewardBracketSchema,
  ConfigurationSchema,
} from "../src/configuration";

// Constants for large configuration objects
const minimalConfiguration = {
  maintenance: false,
  dev: { responseSlowdownMs: 0 },
};

const disabledConfiguration = {
  ...minimalConfiguration,
  quotes: {
    reporting: { enabled: false, maxReports: 0, contentReportLimit: 0 },
    submissionsEnabled: false,
    maxFavorites: 0,
  },
  results: {
    savingEnabled: false,
    objectHashCheckEnabled: false,
    filterPresets: { enabled: false, maxPresetsPerUser: 0 },
    limits: { regularUser: 0, premiumUser: 0 },
    maxBatchSize: 0,
  },
  users: {
    signUp: false,
    lastHashesCheck: { enabled: false, maxHashes: 0 },
    autoBan: { enabled: false, maxCount: 0, maxHours: 0 },
    profiles: { enabled: false },
    discordIntegration: { enabled: false },
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
    inbox: { enabled: false, maxMail: 0 },
    premium: { enabled: false },
  },
  admin: { endpointsEnabled: false },
  apeKeys: {
    endpointsEnabled: false,
    acceptKeys: false,
    maxKeysPerUser: 0,
    apeKeyBytes: 0,
    apeKeySaltRounds: 0,
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
    leaderboardExpirationTimeInDays: 0,
    maxResults: 0,
    validModeRules: [],
    scheduleRewardsModeRules: [],
    topResultsToAnnounce: 0,
    xpRewardBrackets: [],
  },
  leaderboards: {
    minTimeTyping: 0,
    weeklyXp: {
      enabled: false,
      expirationTimeInDays: 0,
      xpRewardBrackets: [],
    },
  },
  connections: { enabled: false, maxPerUser: 0 },
};

const fullConfiguration = {
  maintenance: false,
  dev: { responseSlowdownMs: 0 },
  quotes: {
    reporting: {
      enabled: true,
      maxReports: 5,
      contentReportLimit: 3,
    },
    submissionsEnabled: true,
    maxFavorites: 100,
  },
  results: {
    savingEnabled: true,
    objectHashCheckEnabled: true,
    filterPresets: {
      enabled: true,
      maxPresetsPerUser: 10,
    },
    limits: {
      regularUser: 50,
      premiumUser: 200,
    },
    maxBatchSize: 100,
  },
  users: {
    signUp: true,
    lastHashesCheck: {
      enabled: true,
      maxHashes: 5,
    },
    autoBan: {
      enabled: true,
      maxCount: 3,
      maxHours: 24,
    },
    profiles: {
      enabled: true,
    },
    discordIntegration: {
      enabled: true,
    },
    xp: {
      enabled: true,
      funboxBonus: 1.5,
      gainMultiplier: 1,
      maxDailyBonus: 1000,
      minDailyBonus: 100,
      streak: {
        enabled: true,
        maxStreakDays: 30,
        maxStreakMultiplier: 2,
      },
    },
    inbox: {
      enabled: true,
      maxMail: 50,
    },
    premium: {
      enabled: true,
    },
  },
  admin: { endpointsEnabled: true },
  apeKeys: {
    endpointsEnabled: true,
    acceptKeys: true,
    maxKeysPerUser: 5,
    apeKeyBytes: 32,
    apeKeySaltRounds: 10,
  },
  rateLimiting: {
    badAuthentication: {
      enabled: true,
      penalty: 60,
      flaggedStatusCodes: [401, 403],
    },
  },
  dailyLeaderboards: {
    enabled: true,
    leaderboardExpirationTimeInDays: 1,
    maxResults: 500,
    validModeRules: [{ language: "english", mode: "time", mode2: "30" }],
    scheduleRewardsModeRules: [
      { language: "english", mode: "time", mode2: "(15|60)" },
    ],
    topResultsToAnnounce: 3,
    xpRewardBrackets: [
      {
        minRank: 1,
        maxRank: 10,
        minReward: 100,
        maxReward: 500,
      },
    ],
  },
  leaderboards: {
    minTimeTyping: 10,
    weeklyXp: {
      enabled: true,
      expirationTimeInDays: 7,
      xpRewardBrackets: [
        {
          minRank: 1,
          maxRank: 5,
          minReward: 200,
          maxReward: 1000,
        },
      ],
    },
  },
  connections: {
    enabled: true,
    maxPerUser: 3,
  },
};

describe("configuration schemas", () => {
  describe("ValidModeRuleSchema", () => {
    it.each([
      {
        description: "valid mode rule",
        input: {
          language: "english",
          mode: "time",
          mode2: "30",
        },
      },
      {
        description: "missing mode",
        input: {
          language: "english",
          mode2: "30",
        },
        expectedError: "Required",
      },
      {
        description: "extra field",
        input: {
          language: "english",
          mode: "time",
          mode2: "30",
          extra: true,
        },
        expectedError: "Unrecognized key(s)",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ValidModeRuleSchema).toReject(input, expectedError);
      } else {
        expect(ValidModeRuleSchema).toValidate(input);
      }
    });
  });

  describe("RewardBracketSchema", () => {
    it.each([
      {
        description: "valid reward bracket",
        input: {
          minRank: 1,
          maxRank: 10,
          minReward: 100,
          maxReward: 500,
        },
      },
      {
        description: "zero values are valid",
        input: {
          minRank: 0,
          maxRank: 0,
          minReward: 0,
          maxReward: 0,
        },
      },
      {
        description: "negative minRank",
        input: { ...disabledConfiguration, minRank: -1 },
        expectedError: "Number must be greater than or equal to 0",
      },
      {
        description: "non-integer value",
        input: { ...disabledConfiguration, minRank: 1.5 },
        expectedError: "Expected integer, received float",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(RewardBracketSchema).toReject(input, expectedError);
      } else {
        expect(RewardBracketSchema).toValidate(input);
      }
    });
  });

  describe("ConfigurationSchema", () => {
    it.each([
      {
        description: "valid full configuration",
        input: fullConfiguration,
      },
      {
        description: "maintenance as true",
        input: { ...fullConfiguration, maintenance: true },
      },
      {
        description: "missing required top-level field",
        input: { ...minimalConfiguration, quotes: undefined } as any,
        expectedError: "Required",
      },
      {
        description: "topResultsToAnnounce cannot be zero",
        input: {
          ...fullConfiguration,
          dailyLeaderboards: {
            ...fullConfiguration.dailyLeaderboards,
            topResultsToAnnounce: 0,
          },
        },
        expectedError: "Number must be greater than 0",
      },
      {
        description: "minTimeTyping cannot be negative",
        input: {
          ...fullConfiguration,
          leaderboards: {
            ...fullConfiguration.leaderboards,
            minTimeTyping: -1,
          },
        },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ConfigurationSchema).toReject(input, expectedError);
      } else {
        expect(ConfigurationSchema).toValidate(input);
      }
    });
  });
});
