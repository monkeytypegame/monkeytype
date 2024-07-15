import { configsContract } from "shared/contracts/configs";
import { initServer } from "@ts-rest/express";
import * as RateLimit from "../../middlewares/rate-limit";
import * as ConfigController from "../controllers/config";
import { callController } from ".";

const s = initServer();
export const configsRoutes = s.router(configsContract, {
  get: {
    middleware: [RateLimit.configGet],
    handler: async (r) => callController(ConfigController.getConfig)(r),
  },

  save: {
    middleware: [RateLimit.configUpdate],
    handler: async (r) => callController(ConfigController.saveConfig)(r),
  },
  delete: {
    middleware: [RateLimit.configDelete],
    handler: async (r) => callController(ConfigController.deleteConfig)(r),
  },
});
