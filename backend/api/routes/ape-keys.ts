import joi from "joi";
import { Router } from "express";
import {
  asyncHandler,
  validateConfiguration,
  validateRequest,
} from "../../middlewares/api-utils";
import { authenticateRequest } from "../../middlewares/auth";
import ApeKeysController from "../controllers/ape-keys";
import * as RateLimit from "../../middlewares/rate-limit";

const apeKeyNameSchema = joi
  .string()
  .regex(/^[0-9a-zA-Z_.-]+$/)
  .max(20)
  .messages({
    "string.pattern.base": "Invalid ApeKey name",
    "string.max": "ApeKey name exceeds maximum of 20 characters",
  });

const router = Router();

router.use(
  validateConfiguration({
    criteria: (configuration) => {
      return configuration.apeKeys.endpointsEnabled;
    },
    invalidMessage: "ApeKeys are currently disabled.",
  })
);

router.get(
  "/",
  RateLimit.apeKeysGet,
  authenticateRequest(),
  asyncHandler(ApeKeysController.getApeKeys)
);

router.post(
  "/",
  RateLimit.apeKeysGenerate,
  authenticateRequest(),
  validateRequest({
    body: {
      name: apeKeyNameSchema.required(),
      enabled: joi.boolean().required(),
    },
  }),
  asyncHandler(ApeKeysController.generateApeKey)
);

router.patch(
  "/:apeKeyId",
  RateLimit.apeKeysUpdate,
  authenticateRequest(),
  validateRequest({
    params: {
      apeKeyId: joi.string().required(),
    },
    body: {
      name: apeKeyNameSchema,
      enabled: joi.boolean(),
    },
  }),
  asyncHandler(ApeKeysController.editApeKey)
);

router.delete(
  "/:apeKeyId",
  RateLimit.apeKeysDelete,
  authenticateRequest(),
  validateRequest({
    params: {
      apeKeyId: joi.string().required(),
    },
  }),
  asyncHandler(ApeKeysController.deleteApeKey)
);

export default router;
