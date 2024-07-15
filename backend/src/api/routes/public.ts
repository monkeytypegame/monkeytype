import { Router } from "express";
import * as PublicController from "../controllers/public";
import * as RateLimit from "../../middlewares/rate-limit";
import { asyncHandler } from "../../middlewares/utility";
import joi from "joi";
import { validateRequest } from "../../middlewares/validation";

const GET_MODE_STATS_VALIDATION_SCHEMA = {
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

const router = Router();

router.get(
  "/speedHistogram",
  RateLimit.publicStatsGet,
  validateRequest({
    query: GET_MODE_STATS_VALIDATION_SCHEMA,
  }),
  asyncHandler(PublicController.getPublicSpeedHistogram)
);

router.get(
  "/typingStats",
  RateLimit.publicStatsGet,
  asyncHandler(PublicController.getPublicTypingStats)
);

export default router;
