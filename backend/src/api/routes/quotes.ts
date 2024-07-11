import joi from "joi";
import { authenticateRequest } from "../../middlewares/auth";
import { Router } from "express";
import * as QuoteController from "../controllers/quote";
import * as RateLimit from "../../middlewares/rate-limit";
import {
  asyncHandler,
  checkUserPermissions,
  validateConfiguration,
  validateRequest,
} from "../../middlewares/api-utils";

const router = Router();

const checkIfUserIsQuoteMod = checkUserPermissions({
  criteria: (user) => {
    return (
      user.quoteMod === true ||
      (typeof user.quoteMod === "string" && user.quoteMod !== "")
    );
  },
});

router.get(
  "/",
  authenticateRequest(),
  RateLimit.newQuotesGet,
  checkIfUserIsQuoteMod,
  asyncHandler(QuoteController.getQuotes)
);

router.get(
  "/isSubmissionEnabled",
  authenticateRequest({
    isPublic: true,
  }),
  RateLimit.newQuotesIsSubmissionEnabled,
  asyncHandler(QuoteController.isSubmissionEnabled)
);

router.post(
  "/",
  validateConfiguration({
    criteria: (configuration) => {
      return configuration.quotes.submissionsEnabled;
    },
    invalidMessage:
      "Quote submission is disabled temporarily. The queue is quite long and we need some time to catch up.",
  }),
  authenticateRequest(),
  RateLimit.newQuotesAdd,
  validateRequest(
    {
      body: {
        text: joi.string().min(60).required(),
        source: joi.string().required(),
        language: joi
          .string()
          .regex(/^[\w+]+$/)
          .required(),
        captcha: joi
          .string()
          .regex(/[\w-_]+/)
          .required(),
      },
    },
    { validationErrorMessage: "Please fill all the fields" }
  ),
  asyncHandler(QuoteController.addQuote)
);

router.post(
  "/approve",
  authenticateRequest(),
  RateLimit.newQuotesAction,
  validateRequest(
    {
      body: {
        quoteId: joi.string().required(),
        editText: joi.string().allow(null),
        editSource: joi.string().allow(null),
      },
    },
    { validationErrorMessage: "Please fill all the fields" }
  ),
  checkIfUserIsQuoteMod,
  asyncHandler(QuoteController.approveQuote)
);

router.post(
  "/reject",
  authenticateRequest(),
  RateLimit.newQuotesAction,
  validateRequest({
    body: {
      quoteId: joi.string().required(),
    },
  }),
  checkIfUserIsQuoteMod,
  asyncHandler(QuoteController.refuseQuote)
);

router.get(
  "/rating",
  authenticateRequest(),
  RateLimit.quoteRatingsGet,
  validateRequest({
    query: {
      quoteId: joi.string().regex(/^\d+$/).required(),
      language: joi
        .string()
        .regex(/^[\w+]+$/)
        .required(),
    },
  }),
  asyncHandler(QuoteController.getRating)
);

router.post(
  "/rating",
  authenticateRequest(),
  RateLimit.quoteRatingsSubmit,
  validateRequest({
    body: {
      quoteId: joi.number().required(),
      rating: joi.number().min(1).max(5).required(),
      language: joi
        .string()
        .regex(/^[\w+]+$/)
        .max(50)
        .required(),
    },
  }),
  asyncHandler(QuoteController.submitRating)
);

const withCustomMessages = joi.string().messages({
  "string.pattern.base": "Invalid parameter format",
});

router.post(
  "/report",
  validateConfiguration({
    criteria: (configuration) => {
      return configuration.quotes.reporting.enabled;
    },
    invalidMessage: "Quote reporting is unavailable.",
  }),
  authenticateRequest(),
  RateLimit.quoteReportSubmit,
  validateRequest({
    body: {
      quoteId: withCustomMessages.regex(/\d+/).required(),
      quoteLanguage: withCustomMessages
        .regex(/^[\w+]+$/)
        .max(50)
        .required(),
      reason: joi
        .string()
        .valid(
          "Grammatical error",
          "Duplicate quote",
          "Inappropriate content",
          "Low quality content",
          "Incorrect source"
        )
        .required(),
      comment: withCustomMessages
        .allow("")
        .regex(/^([.]|[^/<>])+$/)
        .max(250)
        .required(),
      captcha: withCustomMessages.regex(/[\w-_]+/).required(),
    },
  }),
  checkUserPermissions({
    criteria: (user) => {
      return user.canReport !== false;
    },
  }),
  asyncHandler(QuoteController.reportQuote)
);

export default router;
