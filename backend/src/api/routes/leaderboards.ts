import joi from "joi";
import { Router } from "express";
import * as RateLimit from "../../middlewares/rate-limit";
import { withApeRateLimiter } from "../../middlewares/ape-rate-limit";
import { authenticateRequest } from "../../middlewares/auth";
import * as LeaderboardController from "../controllers/leaderboard";
import {
  asyncHandler,
  validateRequest,
  validateConfiguration,
} from "../../middlewares/api-utils";

const BASE_LEADERBOARD_VALIDATION_SCHEMA = {
  language: joi.string().required(),
  mode: joi.string().required(),
  mode2: joi.string().required(),
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

const requireDailyLeaderboardsEnabled = validateConfiguration({
  criteria: (configuration) => {
    return configuration.dailyLeaderboards.enabled;
  },
  invalidMessage: "Daily leaderboards are not available at this time.",
});

router.get(
  "/",
  authenticateRequest({ isPublic: true, acceptApeKeys: true }),
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

export default router;
