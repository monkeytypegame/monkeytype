import { resultsContract } from "@monkeytype/contracts/results";
import { initServer } from "@ts-rest/express";
import * as ResultController from "../controllers/result";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(resultsContract, {
  get: {
    handler: async (r) => callController(ResultController.getResults)(r),
  },
  add: {
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
