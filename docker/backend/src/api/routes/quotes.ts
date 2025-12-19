import { quotesContract } from "@monkeytype/contracts/quotes";
import { initServer } from "@ts-rest/express";
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
    handler: async (r) => callController(QuoteController.reportQuote)(r),
  },
});
