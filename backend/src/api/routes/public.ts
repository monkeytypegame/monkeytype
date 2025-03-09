import { publicContract } from "@monkeytype/contracts/public";
import { initServer } from "@ts-rest/express";
import * as PublicController from "../controllers/public";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(publicContract, {
  getSpeedHistogram: {
    handler: async (r) => callController(PublicController.getSpeedHistogram)(r),
  },
  getTypingStats: {
    handler: async (r) => callController(PublicController.getTypingStats)(r),
  },
});
