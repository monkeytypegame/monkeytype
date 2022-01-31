const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const NewQuotesController = require("../controllers/new-quotes");
const QuoteRatingsController = require("../controllers/quote-ratings");
const QuotesController = require("../controllers/quotes");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandlerWrapper,
  requestValidation,
} = require("../../middlewares/api-utils");
const SUPPORTED_QUOTE_LANGUAGES = require("../../constants/quote-languages");

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
      captcha: joi.string().required(),
    },
  }),
  asyncHandlerWrapper(QuotesController.reportQuote)
);

module.exports = quotesRouter;
