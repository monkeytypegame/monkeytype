import { resultsContract } from "@monkeytype/contracts/results";
import { initServer } from "@ts-rest/express";
import { validate } from "../../middlewares/configuration";
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
    handler: async (r) => callController(ResultController.updateTags)(r),
  },
  deleteAll: {
    handler: async (r) => callController(ResultController.deleteAll)(r),
  },
  getLast: {
    handler: async (r) => callController(ResultController.getLastResult)(r),
  },
});
