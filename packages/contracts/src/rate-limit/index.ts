export type Window = "per-second" | "per-minute" | "hourly" | "daily" | number;
export type RateLimitOptions = {
  /** Timeframe or time in milliseconds */
  window: Window;
  /** Max request within the given window */
  max: number;
};

export const limits = {
  defaultApeRateLimit: {
    window: "per-minute",
    max: 30,
  },

  adminLimit: {
    window: 5000, //5 seconds
    max: 1,
  },

  // Config Routing
  configUpdate: {
    window: "hourly",
    max: 500,
  },

  configGet: {
    window: "hourly",
    max: 120,
  },

  configDelete: {
    window: "hourly",
    max: 120,
  },

  // Leaderboards Routing
  leaderboardsGet: {
    window: "hourly",
    max: 500,
  },

  // New Quotes Routing
  newQuotesGet: {
    window: "hourly",
    max: 500,
  },

  newQuotesIsSubmissionEnabled: {
    window: "per-minute",
    max: 60,
  },

  newQuotesAdd: {
    window: "hourly",
    max: 60,
  },

  newQuotesAction: {
    window: "hourly",
    max: 500,
  },

  // Quote Ratings Routing
  quoteRatingsGet: {
    window: "hourly",
    max: 500,
  },

  quoteRatingsSubmit: {
    window: "hourly",
    max: 500,
  },

  // Quote reporting
  quoteReportSubmit: {
    window: 30 * 60 * 1000, // 30 min
    max: 50,
  },

  // Quote favorites
  quoteFavoriteGet: {
    window: 30 * 60 * 1000, // 30 min
    max: 50,
  },

  quoteFavoritePost: {
    window: 30 * 60 * 1000, // 30 min
    max: 50,
  },

  quoteFavoriteDelete: {
    window: 30 * 60 * 1000, // 30 min
    max: 50,
  },

  // Presets Routing
  presetsGet: {
    window: "hourly",
    max: 60,
  },

  presetsAdd: {
    window: "hourly",
    max: 60,
  },

  presetsRemove: {
    window: "hourly",
    max: 60,
  },

  presetsEdit: {
    window: "hourly",
    max: 60,
  },

  // PSA (Public Service Announcement) Routing
  psaGet: {
    window: "per-minute",
    max: 60,
  },

  // get public speed stats
  publicStatsGet: {
    window: "per-minute",
    max: 60,
  },

  // Results Routing
  resultsGet: {
    window: "hourly",
    max: 60,
  },

  // Results Routing
  resultsGetApe: {
    window: "daily",
    max: 30,
  },

  resultsAdd: {
    window: "hourly",
    max: 300,
  },

  resultsTagsUpdate: {
    window: "hourly",
    max: 100,
  },

  resultsDeleteAll: {
    window: "hourly",
    max: 10,
  },

  resultsLeaderboardGet: {
    window: "hourly",
    max: 60,
  },

  resultsLeaderboardQualificationGet: {
    window: "hourly",
    max: 60,
  },

  // Users Routing
  userGet: {
    window: "hourly",
    max: 60,
  },

  setStreakHourOffset: {
    window: "hourly",
    max: 5,
  },

  userSignup: {
    window: "daily",
    max: 2,
  },

  userDelete: {
    window: "daily",
    max: 3,
  },

  userReset: {
    window: "daily",
    max: 3,
  },

  userCheckName: {
    window: "per-minute",
    max: 60,
  },

  userUpdateName: {
    window: "daily",
    max: 3,
  },

  userUpdateLBMemory: {
    window: "per-minute",
    max: 60,
  },

  userUpdateEmail: {
    window: "hourly",
    max: 60,
  },

  userClearPB: {
    window: "hourly",
    max: 60,
  },

  userOptOutOfLeaderboards: {
    window: "hourly",
    max: 10,
  },

  userCustomFilterAdd: {
    window: "hourly",
    max: 60,
  },

  userCustomFilterRemove: {
    window: "hourly",
    max: 60,
  },

  userTagsGet: {
    window: "hourly",
    max: 60,
  },

  userTagsRemove: {
    window: "hourly",
    max: 30,
  },

  userTagsClearPB: {
    window: "hourly",
    max: 60,
  },

  userTagsEdit: {
    window: "hourly",
    max: 30,
  },

  userTagsAdd: {
    window: "hourly",
    max: 30,
  },

  userCustomThemeGet: {
    window: "hourly",
    max: 30,
  },

  userCustomThemeAdd: {
    window: "hourly",
    max: 30,
  },

  userCustomThemeRemove: {
    window: "hourly",
    max: 30,
  },

  userCustomThemeEdit: {
    window: "hourly",
    max: 30,
  },

  userDiscordLink: {
    window: "hourly",
    max: 15,
  },

  userDiscordUnlink: {
    window: "hourly",
    max: 15,
  },

  userRequestVerificationEmail: {
    window: 15 * 60 * 1000, //15 minutes
    max: 1,
  },

  userForgotPasswordEmail: {
    window: "per-minute",
    max: 1,
  },

  userRevokeAllTokens: {
    window: "hourly",
    max: 10,
  },

  userProfileGet: {
    window: "hourly",
    max: 100,
  },

  userProfileUpdate: {
    window: "hourly",
    max: 60,
  },

  userMailGet: {
    window: "hourly",
    max: 60,
  },

  userMailUpdate: {
    window: "hourly",
    max: 60,
  },

  userTestActivity: {
    window: "hourly",
    max: 60,
  },

  userCurrentTestActivity: {
    window: "hourly",
    max: 60,
  },

  userStreak: {
    window: "hourly",
    max: 60,
  },

  // ApeKeys Routing
  apeKeysGet: {
    window: "hourly",
    max: 120,
  },

  apeKeysGenerate: {
    window: "hourly",
    max: 15,
  },

  webhookLimit: {
    window: "per-second",
    max: 1,
  },
} satisfies Record<string, RateLimitOptions>;

export type RateLimit = keyof typeof limits;
export type ApeKeyRateLimit = {
  /** rate limiter options for bearer requests */
  limiter: RateLimit;
  /** optional rate limiter options for apeKey requests. If missing a default limiter with 30 requests/minute is used, */
  apeKeyLimiter?: RateLimit;
};

export function getLimits(limit: RateLimit | ApeKeyRateLimit): {
  limiter: RateLimitOptions;
  apeKeyLimiter?: RateLimitOptions;
} {
  const isApeKeyLimiter = typeof limit === "object";
  const limiter = isApeKeyLimiter ? limit.limiter : limit;
  const apeLimiter = isApeKeyLimiter ? limit.apeKeyLimiter : undefined;

  return {
    limiter: limits[limiter],
    apeKeyLimiter: apeLimiter !== undefined ? limits[apeLimiter] : undefined,
  };
}
