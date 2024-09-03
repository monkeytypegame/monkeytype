import { resultsContract } from "@monkeytype/contracts/results";
import { initServer } from "@ts-rest/express";
import { withApeRateLimiter2 as withApeRateLimiter } from "../../middlewares/ape-rate-limit";
import { validate } from "../../middlewares/configuration";
import * as RateLimit from "../../middlewares/rate-limit";
import * as ResultController from "../controllers/result";
import { callController } from "../ts-rest-adapter";

const validateResultSavingEnabled = validate({
  criteria: (configuration) => {
    return configuration.results.savingEnabled;
  },
  invalidMessage: "Results are not being saved at this time.",
});

const s = initServer();
export default s.router(resultsContract, {
  get: {
    handler: async (r) => callController(ResultController.getResults)(r),
  },
  add: {
    middleware: [validateResultSavingEnabled],
    handler: async (r) => callController(ResultController.addResult)(r),
  },
  updateTags: {
    middleware: [RateLimit.resultsTagsUpdate],
    handler: async (r) => callController(ResultController.updateTags)(r),
  },
  deleteAll: {
    middleware: [RateLimit.resultsDeleteAll],
    handler: async (r) => callController(ResultController.deleteAll)(r),
  },
  getLast: {
    middleware: [withApeRateLimiter(RateLimit.resultsGet)],
    handler: async (r) => callController(ResultController.getLastResult)(r),
  },
});
