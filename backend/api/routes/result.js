const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ResultController = require("../controllers/result");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/",
  RateLimit.limit60perhour,
  authenticateRequest,
  ResultController.getResults
);

router.post(
  "/add",
  RateLimit.limit500perhour,
  authenticateRequest,
  ResultController.addResult
);

router.post(
  "/updateTags",
  RateLimit.limit500perhour,
  authenticateRequest,
  ResultController.updateTags
);

router.post(
  "/deleteAll",
  RateLimit.limit60perhour,
  authenticateRequest,
  ResultController.deleteAll
);

router.get(
  "/getLeaderboard/:type/:mode/:mode2",
  RateLimit.limit60perhour,
  ResultController.getLeaderboard
);

router.post(
  "/checkLeaderboardQualification",
  RateLimit.limit60perhour,
  authenticateRequest,
  ResultController.checkLeaderboardQualification
);

module.exports = router;
