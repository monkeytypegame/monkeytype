const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ResultController = require("../controllers/result");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/",
  RateLimit.resultsGet,
  authenticateRequest,
  ResultController.getResults
);

router.post(
  "/add",
  RateLimit.resultsAdd,
  authenticateRequest,
  ResultController.addResult
);

router.post(
  "/updateTags",
  RateLimit.resultsTagsUpdate,
  authenticateRequest,
  ResultController.updateTags
);

router.post(
  "/deleteAll",
  RateLimit.resultsDeleteAll,
  authenticateRequest,
  ResultController.deleteAll
);

router.get(
  "/getLeaderboard/:type/:mode/:mode2",
  RateLimit.resultsLeaderboardGet,
  ResultController.getLeaderboard
);

router.post(
  "/checkLeaderboardQualification",
  RateLimit.resultsLeaderboardQualificationGet,
  authenticateRequest,
  ResultController.checkLeaderboardQualification
);

module.exports = router;
