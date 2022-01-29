const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const NewQuotesController = require("../controllers/new-quotes");
const QuoteRatingsController = require("../controllers/quote-ratings");
const RateLimit = require("../../middlewares/rate-limit");

const quotesRouter = Router();

quotesRouter.get(
  "/",
  RateLimit.newQuotesGet,
  authenticateRequest,
  NewQuotesController.getQuotes
);

quotesRouter.post(
  "/",
  RateLimit.newQuotesAdd,
  authenticateRequest,
  NewQuotesController.addQuote
);

quotesRouter.post(
  "/approve",
  RateLimit.newQuotesAction,
  authenticateRequest,
  NewQuotesController.approve
);

quotesRouter.post(
  "/reject",
  RateLimit.newQuotesAction,
  authenticateRequest,
  NewQuotesController.refuse
);

quotesRouter.get(
  "/rating",
  RateLimit.quoteRatingsGet,
  authenticateRequest,
  QuoteRatingsController.getRating
);

quotesRouter.post(
  "/rating",
  RateLimit.quoteRatingsSubmit,
  authenticateRequest,
  QuoteRatingsController.submitRating
);

module.exports = quotesRouter;
