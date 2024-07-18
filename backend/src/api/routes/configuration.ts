import joi from "joi";
import { Router } from "express";
import * as ConfigurationController from "../controllers/configuration.js";
import { authenticateRequest } from "../../middlewares/auth.js";
import { adminLimit } from "../../middlewares/rate-limit.js";
import { asyncHandler, useInProduction } from "../../middlewares/utility.js";
import { checkIfUserIsAdmin } from "../../middlewares/permission.js";
import { validateRequest } from "../../middlewares/validation.js";

const router = Router();

router.get("/", asyncHandler(ConfigurationController.getConfiguration));

router.patch(
  "/",
  adminLimit,
  useInProduction([
    authenticateRequest({
      noCache: true,
    }),
    checkIfUserIsAdmin(),
  ]),
  validateRequest({
    body: {
      configuration: joi.object(),
    },
  }),
  asyncHandler(ConfigurationController.updateConfiguration)
);

router.get(
  "/schema",
  adminLimit,
  useInProduction([
    authenticateRequest({
      noCache: true,
    }),
    checkIfUserIsAdmin(),
  ]),
  asyncHandler(ConfigurationController.getSchema)
);

export default router;
