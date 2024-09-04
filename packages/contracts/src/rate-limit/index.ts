export type Window = "per-second" | "per-minute" | "hourly" | "daily" | number;
export type RateLimitOptions = {
  /** Timeframe or time in milliseconds */
  window: Window;
  /** Max request within the given window */
  max: number;
};

export const limits = {
  adminLimit: {
    window: 5000,
    max: 1,
  },
  resultsGet: {
    window: "hourly",
    max: 60,
  },
  resultsGetApe: {
    window: "daily",
    max: 30,
  },
  resultsAdd: {
    window: "hourly",
    max: 300,
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
