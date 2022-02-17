import rateLimit from "express-rate-limit";

const getAddress = (req) =>
  req.headers["cf-connecting-ip"] ||
  req.headers["x-forwarded-for"] ||
  req.ip ||
  "255.255.255.255";
const message = "Too many requests, please try again later";
const multiplier = process.env.MODE === "dev" ? 100 : 1;

// Config Routing
export const configUpdate = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const configGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 120 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Leaderboards Routing
export const leaderboardsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

// New Quotes Routing
export const newQuotesGet = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const newQuotesAdd = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const newQuotesAction = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Quote Ratings Routing
export const quoteRatingsGet = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const quoteRatingsSubmit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Quote reporting
export const quoteReportSubmit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 50 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Presets Routing
export const presetsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const presetsAdd = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const presetsRemove = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const presetsEdit = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

// PSA (Public Service Announcement) Routing
export const psaGet = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Results Routing
export const resultsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const resultsAdd = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const resultsTagsUpdate = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const resultsDeleteAll = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 10 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const resultsLeaderboardGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const resultsLeaderboardQualificationGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Users Routing
export const userGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userSignup = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userDelete = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userCheckName = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userUpdateName = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userUpdateLBMemory = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userUpdateEmail = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userClearPB = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userTagsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userTagsRemove = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 30 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userTagsClearPB = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userTagsEdit = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 30 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userTagsAdd = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 30 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const userDiscordLink = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 15 * multiplier,
  message,
  keyGenerator: getAddress,
});

export const usersTagsEdit = userDiscordLink;

export const userDiscordUnlink = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 15 * multiplier,
  message,
  keyGenerator: getAddress,
});
