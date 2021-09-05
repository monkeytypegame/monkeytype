const { authenticateRequest } = require("../../middlewares/auth");
const LeaderboardsController = require("../controllers/leaderboards");
const RateLimit = require("../../middlewares/rate-limit");

const { Router } = require("express");

const router = Router();

router.get(
  "/",
  RateLimit.limit1persec,
  authenticateRequest,
  LeaderboardsController.get
);

router.post(
  "/debug_update",
  RateLimit.limit1persec,
  LeaderboardsController.update
);

module.exports = router;
