const rateLimit = require("express-rate-limit");

const getAddress = (req) =>
  req.headers["cf-connecting-ip"] ||
  req.headers["x-forwarded-for"] ||
  req.ip ||
  "255.255.255.255";
const message = "Too many requests, please try again later";
const multiplier = process.env.MODE === "dev" ? 100 : 1;

// Config Routing
exports.configUpdate = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.configGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 120 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Leaderboards Routing
exports.leaderboardsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

// New Quotes Routing
exports.newQuotesGet = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.newQuotesAdd = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.newQuotesAction = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Quote Ratings Routing
exports.quoteRatingsGet = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.quoteRatingsSubmit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Quote reporting
exports.quoteReportSubmit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 50 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Presets Routing
exports.presetsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.presetsAdd = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.presetsRemove = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.presetsEdit = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

// PSA (Public Service Announcement) Routing
exports.psaGet = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Results Routing
exports.resultsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.resultsAdd = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.resultsTagsUpdate = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.resultsDeleteAll = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 10 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.resultsLeaderboardGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.resultsLeaderboardQualificationGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

// Users Routing
exports.userGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userSignup = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userDelete = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userCheckName = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userUpdateName = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 3 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userUpdateLBMemory = rateLimit({
  windowMs: 60 * 1000,
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userUpdateEmail = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userClearPB = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userTagsGet = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userTagsRemove = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 30 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userTagsClearPB = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 60 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userTagsEdit = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 30 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userTagsAdd = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 30 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userDiscordLink = exports.usersTagsEdit = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 15 * multiplier,
  message,
  keyGenerator: getAddress,
});

exports.userDiscordUnlink = exports.usersTagsEdit = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  max: 15 * multiplier,
  message,
  keyGenerator: getAddress,
});
