const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const NewQuotesController = require("../controllers/new-quotes");
const QuoteRatingsController = require("../controllers/quote-ratings");
const QuotesController = require("../controllers/quotes");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandler,
  validateRequest,
  validateConfiguration,
} = require("../../middlewares/api-utils");
const SUPPORTED_QUOTE_LANGUAGES = require("../../constants/quote-languages");

const quotesRouter = Router();

quotesRouter.get(
  "/",
  RateLimit.newQuotesGet,
  authenticateRequest(),
  asyncHandler(NewQuotesController.getQuotes)
);

quotesRouter.post(
  "/",
  validateConfiguration({
    criteria: (configuration) => {
      return configuration.quoteSubmit.enabled;
    },
    invalidMessage:
      "Quote submission is disabled temporarily. The queue is quite long and we need some time to catch up.",
  }),
  RateLimit.newQuotesAdd,
  authenticateRequest(),
  validateRequest({
    body: {
      text: joi.string().min(60).required(),
      source: joi.string().required(),
      language: joi.string().required(),
      captcha: joi.string().required(),
    },
    validationErrorMessage: "Please fill all the fields",
  }),
  asyncHandler(NewQuotesController.addQuote)
);

quotesRouter.post(
  "/approve",
  RateLimit.newQuotesAction,
  authenticateRequest(),
  validateRequest({
    body: {
      quoteId: joi.string().required(),
      editText: joi.string().required(),
      editSource: joi.string().required(),
    },
    validationErrorMessage: "Please fill all the fields",
  }),
  asyncHandler(NewQuotesController.approve)
);

quotesRouter.post(
  "/reject",
  RateLimit.newQuotesAction,
  authenticateRequest(),
  validateRequest({
    body: {
      quoteId: joi.string().required(),
    },
  }),
  asyncHandler(NewQuotesController.refuse)
);

quotesRouter.get(
  "/rating",
  RateLimit.quoteRatingsGet,
  authenticateRequest(),
  validateRequest({
    query: {
      quoteId: joi.string().regex(/^\d+$/).required(),
      language: joi.string().required(),
    },
  }),
  asyncHandler(QuoteRatingsController.getRating)
);

quotesRouter.post(
  "/rating",
  RateLimit.quoteRatingsSubmit,
  authenticateRequest(),
  validateRequest({
    body: {
      quoteId: joi.number().required(),
      rating: joi.number().min(1).max(5).required(),
      language: joi.string().required(),
    },
  }),
  asyncHandler(QuoteRatingsController.submitRating)
);

quotesRouter.post(
  "/report",
  validateConfiguration({
    criteria: (configuration) => {
      return configuration.quoteReport.enabled;
    },
    invalidMessage: "Quote reporting is unavailable.",
  }),
  RateLimit.quoteReportSubmit,
  authenticateRequest(),
  validateRequest({
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
          "Low quality content",
          "Incorrect source"
        )
        .required(),
      comment: joi.string().allow("").max(250).required(),
      captcha: joi.string().required(),
    },
  }),
  asyncHandler(QuotesController.reportQuote)
);

module.exports = quotesRouter;
