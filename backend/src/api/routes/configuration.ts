import joi from "joi";
import { Router } from "express";
import {
  asyncHandler,
  checkIfUserIsAdmin,
  useInProduction,
  validateRequest,
} from "../../middlewares/api-utils";
import * as ConfigurationController from "../controllers/configuration";
import { authenticateRequest } from "../../middlewares/auth";
import { adminLimit } from "../../middlewares/rate-limit";

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
