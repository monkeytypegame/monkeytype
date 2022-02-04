const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ResultController = require("../controllers/result");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandlerWrapper,
  requestValidation,
} = require("../../middlewares/api-utils");

const router = Router();

router.get(
  "/",
  RateLimit.resultsGet,
  authenticateRequest(),
  asyncHandlerWrapper(ResultController.getResults)
);

router.post(
  "/add",
  RateLimit.resultsAdd,
  authenticateRequest(),
  asyncHandlerWrapper(ResultController.addResult)
);

router.post(
  "/updateTags",
  RateLimit.resultsTagsUpdate,
  authenticateRequest(),
  asyncHandlerWrapper(ResultController.updateTags)
);

router.post(
  "/deleteAll",
  RateLimit.resultsDeleteAll,
  authenticateRequest(),
  asyncHandlerWrapper(ResultController.deleteAll)
);

router.get(
  "/getLeaderboard/:type/:mode/:mode2",
  RateLimit.resultsLeaderboardGet,
  asyncHandlerWrapper(ResultController.getLeaderboard)
);

router.post(
  "/checkLeaderboardQualification",
  RateLimit.resultsLeaderboardQualificationGet,
  authenticateRequest(),
  asyncHandlerWrapper(ResultController.checkLeaderboardQualification)
);

module.exports = router;
