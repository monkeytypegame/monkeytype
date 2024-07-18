import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth.js";
import configSchema from "../schemas/config-schema.js";
import * as ConfigController from "../controllers/config.js";
import * as RateLimit from "../../middlewares/rate-limit.js";
import { asyncHandler } from "../../middlewares/utility.js";
import { validateRequest } from "../../middlewares/validation.js";

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
