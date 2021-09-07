const { authenticateRequest } = require("../../middlewares/auth");
const LeaderboardsController = require("../controllers/leaderboards");
const RateLimit = require("../../middlewares/rate-limit");

const { Router } = require("express");

const router = Router();

router.get("/", RateLimit.limit1persec, LeaderboardsController.get);

router.get(
  "/rank",
  RateLimit.limit1persec,
  authenticateRequest,
  LeaderboardsController.getRank
);

router.post(
  "/update",
  RateLimit.limit60perhour,
  authenticateRequest,
  LeaderboardsController.update
);

//TODO remove me
router.post(
  "/debug_update",
  RateLimit.limit1persec,
  LeaderboardsController.debugUpdate
);

module.exports = router;
