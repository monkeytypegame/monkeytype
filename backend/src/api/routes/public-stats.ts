import { Router } from "express";
import * as PublicStatsController from "../controllers/public-stats";
import * as RateLimit from "../../middlewares/rate-limit";
import { asyncHandler, validateRequest } from "../../middlewares/api-utils";
import joi from "joi";

const GET_MODE_STATS_VALIDATION_SCHEMA = {
  language: joi.string().required(),
  mode: joi.string().required(),
  mode2: joi.string().required(),
};

const router = Router();

router.get(
  "/speedHistogram",
  RateLimit.publicStatsGet,
  validateRequest({
    query: GET_MODE_STATS_VALIDATION_SCHEMA,
  }),
  asyncHandler(PublicStatsController.getPublicSpeedHistogram)
);

router.get(
  "/typingStats",
  RateLimit.publicStatsGet,
  asyncHandler(PublicStatsController.getPublicTypingStats)
);

export default router;
