import { initServer } from "@ts-rest/express";
import * as RateLimit from "../../middlewares/rate-limit";
import * as ConfigurationController from "../controllers/configuration";
import { callController } from "../ts-rest-adapter";
import { configurationsContract } from "@monkeytype/contracts/configurations";
import { checkIfUserIsAdmin } from "../../middlewares/permission";
import { isDevEnvironment } from "../../utils/misc";

import { NextFunction, RequestHandler, Response } from "express";

const s = initServer();

const requireAdminUser = (): RequestHandler => {
  return async (
    req: MonkeyTypes.Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!isDevEnvironment()) {
      checkIfUserIsAdmin()(req, res, next);
    }
    next();
  };
};

export default s.router(configurationsContract, {
  get: {
    handler: async (r) =>
      callController(ConfigurationController.getConfiguration)(r),
  },

  update: {
    middleware: [requireAdminUser(), RateLimit.adminLimit],
    handler: async (r) =>
      callController(ConfigurationController.updateConfiguration)(r),
  },
  getSchema: {
    middleware: [requireAdminUser(), RateLimit.adminLimit],
    handler: async (r) => callController(ConfigurationController.getSchema)(r),
  },
});
