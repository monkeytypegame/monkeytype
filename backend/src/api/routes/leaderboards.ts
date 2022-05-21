import joi from "joi";
import { Router } from "express";
import * as RateLimit from "../../middlewares/rate-limit";
import apeRateLimit from "../../middlewares/ape-rate-limit";
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

const router = Router();

router.get(
  "/",
  RateLimit.leaderboardsGet,
  authenticateRequest({ isPublic: true, acceptApeKeys: true }),
  validateRequest({
    query: {
      ...BASE_LEADERBOARD_VALIDATION_SCHEMA,
      skip: joi.number().min(0),
      limit: joi.number().min(0).max(50),
    },
  }),
  asyncHandler(LeaderboardController.getLeaderboard)
);

router.get(
  "/rank",
  RateLimit.leaderboardsGet,
  authenticateRequest({ acceptApeKeys: true }),
  apeRateLimit,
  validateRequest({
    query: BASE_LEADERBOARD_VALIDATION_SCHEMA,
  }),
  asyncHandler(LeaderboardController.getRankFromLeaderboard)
);

router.get(
  "/daily",
  validateConfiguration({
    criteria: (configuration) => {
      return configuration.dailyLeaderboards.enabled;
    },
    invalidMessage: "Daily leaderboards are not available at this time.",
  }),
  RateLimit.leaderboardsGet,
  authenticateRequest({ isPublic: true }),
  validateRequest({
    query: BASE_LEADERBOARD_VALIDATION_SCHEMA,
  }),
  asyncHandler(LeaderboardController.getDailyLeaderboard)
);

export default router;
