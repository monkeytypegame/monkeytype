import _ from "lodash";
import MonkeyError from "../utils/error";
import type { Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import rateLimit, { type Options } from "express-rate-limit";
import { isDevEnvironment } from "../utils/misc";

const REQUEST_MULTIPLIER = isDevEnvironment() ? 100 : 1;

const getKey = (req: MonkeyTypes.Request, _res: Response): string => {
  return (
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string) ||
    (req.ip as string) ||
    "255.255.255.255"
  );
};

const getKeyWithUid = (req: MonkeyTypes.Request, _res: Response): string => {
  const uid = req?.ctx?.decodedToken?.uid;
  const useUid = uid !== undefined && uid !== "";

  return useUid ? uid : getKey(req, _res);
};

export const customHandler = (
  _req: MonkeyTypes.Request,
  _res: Response,
  _next: NextFunction,
  _options: Options
): void => {
  throw new MonkeyError(429, "Request limit reached, please try again later.");
};

const ONE_HOUR_SECONDS = 60 * 60;
const ONE_HOUR_MS = 1000 * ONE_HOUR_SECONDS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// Root Rate Limit
export const rootRateLimiter = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 1000 * REQUEST_MULTIPLIER,
  keyGenerator: getKey,
  handler: (_req, _res, _next, _options): void => {
    throw new MonkeyError(
      429,
      "Maximum API request (root) limit reached. Please try again later."
    );
  },
});

// Bad Authentication Rate Limiter
const badAuthRateLimiter = new RateLimiterMemory({
  points: 30 * REQUEST_MULTIPLIER,
  duration: ONE_HOUR_SECONDS,
});

export async function badAuthRateLimiterHandler(
  req: MonkeyTypes.Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const badAuthEnabled =
    req?.ctx?.configuration?.rateLimiting?.badAuthentication?.enabled;
  if (!badAuthEnabled) {
    next();
    return;
  }

  try {
    const key = getKey(req, res);
    const rateLimitStatus = await badAuthRateLimiter.get(key);

    if (rateLimitStatus !== null && rateLimitStatus?.remainingPoints <= 0) {
      throw new MonkeyError(
        429,
        "Too many bad authentication attempts, please try again later."
      );
    }
  } catch (error) {
    next(error);
    return;
  }

  next();
}

export async function incrementBadAuth(
  req: MonkeyTypes.Request,
  res: Response,
  status: number
): Promise<void> {
  const { enabled, penalty, flaggedStatusCodes } =
    req?.ctx?.configuration?.rateLimiting?.badAuthentication ?? {};

  if (!enabled || !flaggedStatusCodes.includes(status)) {
    return;
  }

  try {
    const key = getKey(req, res);
    await badAuthRateLimiter.penalty(key, penalty);
  } catch (error) {}
}

export const adminLimit = rateLimit({
  windowMs: 5000,
  max: 1 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// Config Routing
export const configUpdate = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const configGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 120 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const configDelete = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 120 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// Leaderboards Routing
export const leaderboardsGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// New Quotes Routing
export const newQuotesGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const newQuotesIsSubmissionEnabled = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const newQuotesAdd = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const newQuotesAction = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// Quote Ratings Routing
export const quoteRatingsGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const quoteRatingsSubmit = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// Quote reporting
export const quoteReportSubmit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 50 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// Quote favorites
export const quoteFavoriteGet = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 50 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const quoteFavoritePost = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 50 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const quoteFavoriteDelete = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 50 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// Presets Routing
export const presetsGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const presetsAdd = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const presetsRemove = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const presetsEdit = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// PSA (Public Service Announcement) Routing
export const psaGet = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// get public speed stats
export const publicStatsGet = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// Results Routing
export const resultsGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// Results Routing
export const resultsGetApe = rateLimit({
  windowMs: ONE_DAY_MS,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const resultsAdd = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 300 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const resultsTagsUpdate = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 100 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const resultsDeleteAll = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 10 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const resultsLeaderboardGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const resultsLeaderboardQualificationGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// Users Routing
export const userGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const setStreakHourOffset = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 5 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userSignup = rateLimit({
  windowMs: 24 * ONE_HOUR_MS, // 1 day
  max: 2 * REQUEST_MULTIPLIER,
  keyGenerator: getKey,
  handler: customHandler,
});

export const userDelete = rateLimit({
  windowMs: 24 * ONE_HOUR_MS, // 1 day
  max: 3 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userReset = rateLimit({
  windowMs: 24 * ONE_HOUR_MS, // 1 day
  max: 3 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userCheckName = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userUpdateName = rateLimit({
  windowMs: 24 * ONE_HOUR_MS, // 1 day
  max: 3 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userUpdateLBMemory = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userUpdateEmail = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userClearPB = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userOptOutOfLeaderboards = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 10 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userCustomFilterAdd = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userCustomFilterRemove = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userTagsGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userTagsRemove = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userTagsClearPB = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userTagsEdit = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userTagsAdd = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userCustomThemeGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userCustomThemeAdd = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userCustomThemeRemove = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userCustomThemeEdit = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userDiscordLink = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 15 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const usersTagsEdit = userDiscordLink;

export const userDiscordUnlink = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 15 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userRequestVerificationEmail = rateLimit({
  windowMs: ONE_HOUR_MS / 4,
  max: 1 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userForgotPasswordEmail = rateLimit({
  windowMs: ONE_HOUR_MS / 60,
  max: 1 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userRevokeAllTokens = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 10 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userProfileGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 100 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userProfileUpdate = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userMailGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userMailUpdate = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userTestActivity = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userCurrentTestActivity = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const userStreak = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

// ApeKeys Routing
export const apeKeysGet = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 120 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const apeKeysGenerate = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 15 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const webhookLimit = rateLimit({
  windowMs: 1000,
  max: 1 * REQUEST_MULTIPLIER,
  keyGenerator: getKeyWithUid,
  handler: customHandler,
});

export const apeKeysUpdate = apeKeysGenerate;

export const apeKeysDelete = apeKeysGenerate;
