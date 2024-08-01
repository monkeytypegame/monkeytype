import { publicContract } from "@monkeytype/contracts/public";
import { initServer } from "@ts-rest/express";
import * as RateLimit from "../../middlewares/rate-limit";
import * as PublicController from "../controllers/public";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(publicContract, {
  getSpeedHistogram: {
    middleware: [RateLimit.publicStatsGet],
    handler: async (r) => callController(PublicController.getSpeedHistogram)(r),
  },
  getTypingStats: {
    middleware: [RateLimit.publicStatsGet],
    handler: async (r) => callController(PublicController.getTypingStats)(r),
  },
});
