import { configsContract } from "../../../../shared/contract/configs.contract";
import { initServer } from "@ts-rest/express";
import { authenticateRequestV2 } from "../../middlewares/auth";
import * as RateLimit from "../../middlewares/rate-limit";
import * as ConfigController from "../controllers/config";
import { callController } from ".";

const s = initServer();
export const configsRoutes = s.router(configsContract, {
  get: {
    middleware: [authenticateRequestV2(), RateLimit.configGet],
    handler: async (r) => callController(ConfigController.getConfig)(r),
  },

  save: {
    middleware: [authenticateRequestV2(), RateLimit.configUpdate],
    handler: async (r) => callController(ConfigController.saveConfig)(r),
  },
});
