import { z } from "zod";

/* ValidModeRuleSchema allows complex rules like `"mode2": "(15|60)"`. We don't want a strict validation here. */
export const ValidModeRuleSchema = z
  .object({
    language: z.string(),
    mode: z.string(),
    mode2: z.string(),
  })
  .strict();
export type ValidModeRule = z.infer<typeof ValidModeRuleSchema>;

export const RewardBracketSchema = z
  .object({
    minRank: z.number().int().nonnegative(),
    maxRank: z.number().int().nonnegative(),
    minReward: z.number().int().nonnegative(),
    maxReward: z.number().int().nonnegative(),
  })
  .strict();
export type RewardBracket = z.infer<typeof RewardBracketSchema>;

export const ConfigurationSchema = z.object({
  maintenance: z.boolean(),
  dev: z.object({
    responseSlowdownMs: z.number().int().nonnegative(),
  }),
  quotes: z.object({
    reporting: z.object({
      enabled: z.boolean(),
      maxReports: z.number().int().nonnegative(),
      contentReportLimit: z.number().int().nonnegative(),
    }),
    submissionsEnabled: z.boolean(),
    maxFavorites: z.number().int().nonnegative(),
  }),
  results: z.object({
    savingEnabled: z.boolean(),
    objectHashCheckEnabled: z.boolean(),
    filterPresets: z.object({
      enabled: z.boolean(),
      maxPresetsPerUser: z.number().int().nonnegative(),
    }),
    limits: z.object({
      regularUser: z.number().int().nonnegative(),
      premiumUser: z.number().int().nonnegative(),
    }),
    maxBatchSize: z.number().int().nonnegative(),
  }),
  users: z.object({
    signUp: z.boolean(),
    lastHashesCheck: z.object({
      enabled: z.boolean(),
      maxHashes: z.number().int().nonnegative(),
    }),
    autoBan: z.object({
      enabled: z.boolean(),
      maxCount: z.number().int().nonnegative(),
      maxHours: z.number().int().nonnegative(),
    }),
    profiles: z.object({
      enabled: z.boolean(),
    }),
    discordIntegration: z.object({
      enabled: z.boolean(),
    }),
    xp: z.object({
      enabled: z.boolean(),
      funboxBonus: z.number(),
      gainMultiplier: z.number(),
      maxDailyBonus: z.number(),
      minDailyBonus: z.number(),
      streak: z.object({
        enabled: z.boolean(),
        maxStreakDays: z.number().nonnegative(),
        maxStreakMultiplier: z.number(),
      }),
    }),
    inbox: z.object({
      enabled: z.boolean(),
      maxMail: z.number().int().nonnegative(),
    }),
    premium: z.object({
      enabled: z.boolean(),
    }),
  }),
  admin: z.object({
    endpointsEnabled: z.boolean(),
  }),
  apeKeys: z.object({
    endpointsEnabled: z.boolean(),
    acceptKeys: z.boolean(),
    maxKeysPerUser: z.number().int().nonnegative(),
    apeKeyBytes: z.number().int().nonnegative(),
    apeKeySaltRounds: z.number().int().nonnegative(),
  }),
  rateLimiting: z.object({
    badAuthentication: z.object({
      enabled: z.boolean(),
      penalty: z.number(),
      flaggedStatusCodes: z.array(z.number().int().nonnegative()),
    }),
  }),
  dailyLeaderboards: z.object({
    enabled: z.boolean(),
    leaderboardExpirationTimeInDays: z.number().nonnegative(),
    maxResults: z.number().int().nonnegative(),
    validModeRules: z.array(ValidModeRuleSchema),
    scheduleRewardsModeRules: z.array(ValidModeRuleSchema),
    topResultsToAnnounce: z.number().int().positive(), // This should never be 0. Setting to zero will announce all results.
    xpRewardBrackets: z.array(RewardBracketSchema),
  }),
  leaderboards: z.object({
    weeklyXp: z.object({
      enabled: z.boolean(),
      expirationTimeInDays: z.number().nonnegative(),
      xpRewardBrackets: z.array(RewardBracketSchema),
    }),
  }),
});
export type Configuration = z.infer<typeof ConfigurationSchema>;
