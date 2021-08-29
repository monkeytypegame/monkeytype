const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const QuoteRatingsController = require("../controllers/quote-ratings");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/get",
  RateLimit.limit500perhour,
  authenticateRequest,
  QuoteRatingsController.getRating
);

router.post(
  "/submit",
  RateLimit.limit500perhour,
  authenticateRequest,
  QuoteRatingsController.submitRating
);

module.exports = router;
