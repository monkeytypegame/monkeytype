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
  asyncHandlerWrapper(LeaderboardsController.get)
);

router.get(
  "/rank",
  RateLimit.leaderboardsGet,
  authenticateRequest,
  asyncHandlerWrapper(LeaderboardsController.getRank)
);

module.exports = router;
