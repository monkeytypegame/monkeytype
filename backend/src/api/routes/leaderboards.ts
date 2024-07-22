import joi from "joi";
import { Router } from "express";
import * as RateLimit from "../../middlewares/rate-limit";
import { withApeRateLimiter } from "../../middlewares/ape-rate-limit";
import { authenticateRequest } from "../../middlewares/auth";
import * as LeaderboardController from "../controllers/leaderboard";
import { validate } from "../../middlewares/configuration";
import { validateRequest } from "../../middlewares/validation";
import { asyncHandler } from "../../middlewares/utility";

const BASE_LEADERBOARD_VALIDATION_SCHEMA = {
  language: joi
    .string()
    .max(50)
    .pattern(/^[a-zA-Z0-9_+]+$/)
    .required(),
  mode: joi
    .string()
    .valid("time", "words", "quote", "zen", "custom")
    .required(),
  mode2: joi
    .string()
    .regex(/^(\d)+|custom|zen/)
    .required(),
};

const LEADERBOARD_VALIDATION_SCHEMA_WITH_LIMIT = {
  ...BASE_LEADERBOARD_VALIDATION_SCHEMA,
  skip: joi.number().min(0),
  limit: joi.number().min(0).max(50),
};

const DAILY_LEADERBOARD_VALIDATION_SCHEMA = {
  ...LEADERBOARD_VALIDATION_SCHEMA_WITH_LIMIT,
  daysBefore: joi.number().min(1).max(1),
};

const router = Router();

const requireDailyLeaderboardsEnabled = validate({
  criteria: (configuration) => {
    return configuration.dailyLeaderboards.enabled;
  },
  invalidMessage: "Daily leaderboards are not available at this time.",
});

router.get(
  "/",
  authenticateRequest({ isPublic: true }),
  withApeRateLimiter(RateLimit.leaderboardsGet),
  validateRequest({
    query: LEADERBOARD_VALIDATION_SCHEMA_WITH_LIMIT,
  }),
  asyncHandler(LeaderboardController.getLeaderboard)
);

router.get(
  "/rank",
  authenticateRequest({ acceptApeKeys: true }),
  withApeRateLimiter(RateLimit.leaderboardsGet),
  validateRequest({
    query: BASE_LEADERBOARD_VALIDATION_SCHEMA,
  }),
  asyncHandler(LeaderboardController.getRankFromLeaderboard)
);

router.get(
  "/daily",
  requireDailyLeaderboardsEnabled,
  authenticateRequest({ isPublic: true }),
  RateLimit.leaderboardsGet,
  validateRequest({
    query: DAILY_LEADERBOARD_VALIDATION_SCHEMA,
  }),
  asyncHandler(LeaderboardController.getDailyLeaderboard)
);

router.get(
  "/daily/rank",
  requireDailyLeaderboardsEnabled,
  authenticateRequest(),
  RateLimit.leaderboardsGet,
  validateRequest({
    query: DAILY_LEADERBOARD_VALIDATION_SCHEMA,
  }),
  asyncHandler(LeaderboardController.getDailyLeaderboardRank)
);

const BASE_XP_LEADERBOARD_VALIDATION_SCHEMA = {
  skip: joi.number().min(0),
  limit: joi.number().min(0).max(50),
};

const WEEKLY_XP_LEADERBOARD_VALIDATION_SCHEMA = {
  ...BASE_XP_LEADERBOARD_VALIDATION_SCHEMA,
  weeksBefore: joi.number().min(1).max(1),
};

const requireWeeklyXpLeaderboardEnabled = validate({
  criteria: (configuration) => {
    return configuration.leaderboards.weeklyXp.enabled;
  },
  invalidMessage: "Weekly XP leaderboards are not available at this time.",
});

router.get(
  "/xp/weekly",
  requireWeeklyXpLeaderboardEnabled,
  authenticateRequest({ isPublic: true }),
  withApeRateLimiter(RateLimit.leaderboardsGet),
  validateRequest({
    query: WEEKLY_XP_LEADERBOARD_VALIDATION_SCHEMA,
  }),
  asyncHandler(LeaderboardController.getWeeklyXpLeaderboardResults)
);

router.get(
  "/xp/weekly/rank",
  requireWeeklyXpLeaderboardEnabled,
  authenticateRequest(),
  withApeRateLimiter(RateLimit.leaderboardsGet),
  asyncHandler(LeaderboardController.getWeeklyXpLeaderboardRank)
);

export default router;
