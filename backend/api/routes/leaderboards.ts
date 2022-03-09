import joi from "joi";
import { Router } from "express";
import * as RateLimit from "../../middlewares/rate-limit";
import apeRateLimit from "../../middlewares/ape-rate-limit";
import { authenticateRequest } from "../../middlewares/auth";
import LeaderboardsController from "../controllers/leaderboards";
import { asyncHandler, validateRequest } from "../../middlewares/api-utils";

const router = Router();

router.get(
  "/",
  RateLimit.leaderboardsGet,
  authenticateRequest({ isPublic: true, acceptApeKeys: true }),
  validateRequest({
    query: {
      language: joi.string().required(),
      mode: joi.string().required(),
      mode2: joi.string().required(),
      skip: joi.number().min(0),
      limit: joi.number().min(0).max(50),
    },
    validationErrorMessage: "Missing parameters",
  }),
  asyncHandler(LeaderboardsController.get)
);

router.get(
  "/rank",
  RateLimit.leaderboardsGet,
  authenticateRequest({ acceptApeKeys: true }),
  apeRateLimit,
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
