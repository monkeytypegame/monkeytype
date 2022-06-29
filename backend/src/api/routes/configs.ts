import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth";
import { asyncHandler, validateRequest } from "../../middlewares/api-utils";
import configSchema from "../schemas/config-schema";
import * as ConfigController from "../controllers/config";
import * as RateLimit from "../../middlewares/rate-limit";

const router = Router();

router.get(
  "/",
  authenticateRequest(),
  RateLimit.configGet,
  asyncHandler(ConfigController.getConfig)
);

router.patch(
  "/",
  authenticateRequest(),
  RateLimit.configUpdate,
  validateRequest({
    body: {
      config: configSchema.required(),
    },
  }),
  asyncHandler(ConfigController.saveConfig)
);

export default router;
