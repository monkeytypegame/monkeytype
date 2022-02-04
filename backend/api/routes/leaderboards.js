const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const LeaderboardsController = require("../controllers/leaderboards");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandlerWrapper,
  requestValidation,
} = require("../../middlewares/api-utils");

const { Router } = require("express");

const router = Router();

router.get(
  "/",
  RateLimit.leaderboardsGet,
  authenticateRequest({ isPublic: true }),
  requestValidation({
    query: {
      language: joi.string().required(),
      mode: joi.string().required(),
      mode2: joi.string().required(),
      skip: joi.number().min(0).required(),
      limit: joi.number(),
    },
    validationErrorMessage: "Missing parameters",
  }),
  asyncHandlerWrapper(LeaderboardsController.get)
);

router.get(
  "/rank",
  RateLimit.leaderboardsGet,
  authenticateRequest(),
  requestValidation({
    query: {
      language: joi.string().required(),
      mode: joi.string().required(),
      mode2: joi.string().required(),
    },
    validationErrorMessage: "Missing parameters",
  }),
  asyncHandlerWrapper(LeaderboardsController.getRank)
);

module.exports = router;
