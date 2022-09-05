import joi from "joi";
import { Router } from "express";
import * as RateLimit from "../../middlewares/rate-limit";
import { withApeRateLimiter } from "../../middlewares/ape-rate-limit";
import { authenticateRequest } from "../../middlewares/auth";
import * as SeasonController from "../controllers/season";
import {
  asyncHandler,
  validateRequest,
  validateConfiguration,
} from "../../middlewares/api-utils";

const BASE_SEASON_VALIDATION_SCHEMA = {
  skip: joi.number().min(0),
  limit: joi.number().min(0).max(50),
};

const WEEKLY_SEASON_VALIDATION_SCHEMA = {
  ...BASE_SEASON_VALIDATION_SCHEMA,
  weeksBefore: joi.number().min(1).max(1),
};

const router = Router();

const requireWeeklySeasonsEnabled = validateConfiguration({
  criteria: (configuration) => {
    return configuration.seasons.weekly.enabled;
  },
  invalidMessage: "Seasons are not available at this time.",
});

router.use(requireWeeklySeasonsEnabled);

router.get(
  "/weekly",
  authenticateRequest({ isPublic: true }),
  withApeRateLimiter(RateLimit.leaderboardsGet),
  validateRequest({
    query: WEEKLY_SEASON_VALIDATION_SCHEMA,
  }),
  asyncHandler(SeasonController.getWeeklySeasonResults)
);

router.get(
  "/weekly/rank",
  authenticateRequest(),
  withApeRateLimiter(RateLimit.leaderboardsGet),
  asyncHandler(SeasonController.getWeeklySeasonRank)
);

export default router;
