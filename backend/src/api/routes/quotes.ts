import { quotesContract } from "@monkeytype/contracts/quotes";
import { initServer } from "@ts-rest/express";
import { validate } from "../../middlewares/configuration";
import * as QuoteController from "../controllers/quote";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(quotesContract, {
  get: {
    handler: async (r) => callController(QuoteController.getQuotes)(r),
  },
  isSubmissionEnabled: {
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
    ],
    handler: async (r) => callController(QuoteController.addQuote)(r),
  },
  approveSubmission: {
    handler: async (r) => callController(QuoteController.approveQuote)(r),
  },
  rejectSubmission: {
    handler: async (r) => callController(QuoteController.refuseQuote)(r),
  },
  getRating: {
    handler: async (r) => callController(QuoteController.getRating)(r),
  },
  addRating: {
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
    ],
    handler: async (r) => callController(QuoteController.reportQuote)(r),
  },
});
