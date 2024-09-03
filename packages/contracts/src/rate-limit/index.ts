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
