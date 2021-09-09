const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const NewQuotesController = require("../controllers/new-quotes");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get("/get", RateLimit.limit500perhour, NewQuotesController.getQuotes);

router.post(
  "/add",
  RateLimit.limit500perhour,
  authenticateRequest,
  NewQuotesController.addQuote
);

module.exports = router;
