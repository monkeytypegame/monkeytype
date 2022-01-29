const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const NewQuotesController = require("../controllers/new-quotes");
const QuoteRatingsController = require("../controllers/quote-ratings");
const RateLimit = require("../../middlewares/rate-limit");
const { requestValidation } = require("../../middlewares/apiUtils");
const SUPPORTED_QUOTE_LANGUAGES = require("../../constants/quoteLanguages");

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

quotesRouter.post(
  "/report",
  RateLimit.quoteReportSubmit,
  authenticateRequest,
  requestValidation({
    body: {
      quoteId: joi.string().required(),
      quoteLanguage: joi
        .string()
        .valid(...SUPPORTED_QUOTE_LANGUAGES)
        .required(),
      reason: joi
        .string()
        .valid(
          "Grammatical error",
          "Inappropriate content",
          "Low quality content"
        )
        .required(),
      comment: joi.string().allow("").max(250).required(),
    },
  }),
  (req, res) => {
    res.sendStatus(200);
  }
);

module.exports = quotesRouter;
