const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const QuoteRatingsController = require("../controllers/quote-ratings");

const router = Router();

router.get("/get", authenticateRequest, QuoteRatingsController.getRating);

router.post(
  "/submit",
  authenticateRequest,
  QuoteRatingsController.submitRating
);

module.exports = router;
