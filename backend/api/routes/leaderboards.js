const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const LeaderboardsController = require("../controllers/leaderboards");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandler,
  validateRequest,
} = require("../../middlewares/api-utils");

const { Router } = require("express");

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

module.exports = router;
