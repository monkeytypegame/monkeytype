import joi from "joi";
import { authenticateRequest } from "../../middlewares/auth";
import { Router } from "express";
import NewQuotesController from "../controllers/new-quotes";
import QuotesController from "../controllers/quotes";
import * as RateLimit from "../../middlewares/rate-limit";
import {
  asyncHandler,
  validateConfiguration,
  validateRequest,
} from "../../middlewares/api-utils";
import SUPPORTED_QUOTE_LANGUAGES from "../../constants/quote-languages";

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
      editText: joi.string().allow(null),
      editSource: joi.string().allow(null),
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
  asyncHandler(QuotesController.getRating)
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
  asyncHandler(QuotesController.submitRating)
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

export default quotesRouter;
