import joi from "joi";
import { authenticateRequest } from "../../middlewares/auth";
import LeaderboardsController from "../controllers/leaderboards";
import * as RateLimit from "../../middlewares/rate-limit";
import { asyncHandler, validateRequest } from "../../middlewares/api-utils";
import { Router } from "express";

const router = Router();

router.get(
  "/",
  RateLimit.leaderboardsGet,
  authenticateRequest({ isPublic: true }),
  validateRequest({
    query: {
      language: joi.string().required(),
      mode: joi.string().required(),
      mode2: joi.string().required(),
      skip: joi.number().min(0).required(),
      limit: joi.number(),
    },
    validationErrorMessage: "Missing parameters",
  }),
  asyncHandler(LeaderboardsController.get)
);

router.get(
  "/rank",
  RateLimit.leaderboardsGet,
  authenticateRequest(),
  validateRequest({
    query: {
      language: joi.string().required(),
      mode: joi.string().required(),
      mode2: joi.string().required(),
    },
    validationErrorMessage: "Missing parameters",
  }),
  asyncHandler(LeaderboardsController.getRank)
);

export default router;
