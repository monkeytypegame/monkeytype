import { Response, NextFunction } from "express";
import rateLimit, { Options } from "express-rate-limit";
import MonkeyError from "../handlers/error";

const REQUEST_MULTIPLIER = process.env.MODE === "dev" ? 100 : 1;

const getAddress = (req: MonkeyTypes.Request, _res: Response): string => {
  return (req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.ip ||
    "255.255.255.255") as string;
};

const customHandler = (
  _req: MonkeyTypes.Request,
  _res: Response,
  _next: NextFunction,
  _options: Options
): void => {
  throw new MonkeyError(429, "Too many attempts, please try again later.");
};

// Config Routing
export const configUpdate = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const configGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 120 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

// Leaderboards Routing
export const leaderboardsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

// New Quotes Routing
export const newQuotesGet = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const newQuotesAdd = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const newQuotesAction = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

// Quote Ratings Routing
export const quoteRatingsGet = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const quoteRatingsSubmit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

// Quote reporting
export const quoteReportSubmit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 50 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

// Presets Routing
export const presetsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const presetsAdd = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const presetsRemove = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const presetsEdit = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

// PSA (Public Service Announcement) Routing
export const psaGet = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

// Results Routing
export const resultsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const resultsAdd = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const resultsTagsUpdate = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const resultsDeleteAll = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 10 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const resultsLeaderboardGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const resultsLeaderboardQualificationGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

// Users Routing
export const userGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userSignup = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userDelete = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userCheckName = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userUpdateName = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userUpdateLBMemory = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userUpdateEmail = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userClearPB = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userTagsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userTagsRemove = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userTagsClearPB = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userTagsEdit = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userTagsAdd = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 30 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const userDiscordLink = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 15 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});

export const usersTagsEdit = userDiscordLink;

export const userDiscordUnlink = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 15 * REQUEST_MULTIPLIER,
  keyGenerator: getAddress,
  handler: customHandler,
});
