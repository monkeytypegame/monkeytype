import { quotesContract } from "@monkeytype/contracts/quotes";
import { initServer } from "@ts-rest/express";
import { validate } from "../../middlewares/configuration";
import { checkUserPermissions } from "../../middlewares/permission";
import * as RateLimit from "../../middlewares/rate-limit";
import * as QuoteController from "../controllers/quote";
import { callController } from "../ts-rest-adapter";

const checkIfUserIsQuoteMod = checkUserPermissions(["quoteMod"], {
  criteria: (user) => {
    return (
      user.quoteMod === true ||
      (typeof user.quoteMod === "string" && user.quoteMod !== "")
    );
  },
});

const s = initServer();
export default s.router(quotesContract, {
  get: {
    middleware: [checkIfUserIsQuoteMod, RateLimit.newQuotesGet],
    handler: async (r) => callController(QuoteController.getQuotes)(r),
  },
  isSubmissionEnabled: {
    middleware: [RateLimit.newQuotesIsSubmissionEnabled],
    handler: async (r) =>
      callController(QuoteController.isSubmissionEnabled)(r),
  },
  add: {
    middleware: [
      validate({
        criteria: (configuration) => {
          return configuration.quotes.submissionsEnabled;
        },
        invalidMessage:
          "Quote submission is disabled temporarily. The queue is quite long and we need some time to catch up.",
      }),
      RateLimit.newQuotesAdd,
    ],
    handler: async (r) => callController(QuoteController.addQuote)(r),
  },
  approveSubmission: {
    middleware: [checkIfUserIsQuoteMod, RateLimit.newQuotesAction],
    handler: async (r) => callController(QuoteController.approveQuote)(r),
  },
  rejectSubmission: {
    middleware: [checkIfUserIsQuoteMod, RateLimit.newQuotesAction],
    handler: async (r) => callController(QuoteController.refuseQuote)(r),
  },
  getRating: {
    //@ts-expect-error
    middleware: [RateLimit.quoteRatingsGet],
    handler: async (r) => callController(QuoteController.getRating)(r),
  },
  addRating: {
    middleware: [RateLimit.quoteRatingsSubmit],
    handler: async (r) => callController(QuoteController.submitRating)(r),
  },
  report: {
    middleware: [
      validate({
        criteria: (configuration) => {
          return configuration.quotes.reporting.enabled;
        },
        invalidMessage: "Quote reporting is unavailable.",
      }),
      RateLimit.quoteReportSubmit,
      checkUserPermissions(["canReport"], {
        criteria: (user) => {
          return user.canReport !== false;
        },
      }),
    ],
    handler: async (r) => callController(QuoteController.reportQuote)(r),
  },
});
