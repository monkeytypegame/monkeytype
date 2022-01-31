const { authenticateRequest } = require("../../middlewares/auth");
const LeaderboardsController = require("../controllers/leaderboards");
const RateLimit = require("../../middlewares/rate-limit");

const { Router } = require("express");

const router = Router();

router.get("/", RateLimit.leaderboardsGet, LeaderboardsController.get);

router.get(
  "/rank",
  RateLimit.leaderboardsGet,
  authenticateRequest,
  LeaderboardsController.getRank
);

module.exports = router;
