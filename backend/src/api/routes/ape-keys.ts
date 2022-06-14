import joi from "joi";
import { Router } from "express";
import {
  asyncHandler,
  checkUserPermissions,
  validateConfiguration,
  validateRequest,
} from "../../middlewares/api-utils";
import { authenticateRequest } from "../../middlewares/auth";
import * as ApeKeyController from "../controllers/ape-key";
import * as RateLimit from "../../middlewares/rate-limit";

const apeKeyNameSchema = joi
  .string()
  .regex(/^[0-9a-zA-Z_.-]+$/)
  .max(20)
  .messages({
    "string.pattern.base": "Invalid ApeKey name",
    "string.max": "ApeKey name exceeds maximum of 20 characters",
  });

const checkIfUserCanManageApeKeys = checkUserPermissions({
  criteria: (user) => {
    // Must be an exact check
    return user.canManageApeKeys !== false;
  },
  invalidMessage: "You have lost access to ape keys, please contact support",
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
  checkIfUserCanManageApeKeys,
  asyncHandler(ApeKeyController.getApeKeys)
);

router.post(
  "/",
  RateLimit.apeKeysGenerate,
  authenticateRequest(),
  checkIfUserCanManageApeKeys,
  validateRequest({
    body: {
      name: apeKeyNameSchema.required(),
      enabled: joi.boolean().required(),
    },
  }),
  asyncHandler(ApeKeyController.generateApeKey)
);

router.patch(
  "/:apeKeyId",
  RateLimit.apeKeysUpdate,
  authenticateRequest(),
  checkIfUserCanManageApeKeys,
  validateRequest({
    params: {
      apeKeyId: joi.string().required(),
    },
    body: {
      name: apeKeyNameSchema,
      enabled: joi.boolean(),
    },
  }),
  asyncHandler(ApeKeyController.editApeKey)
);

router.delete(
  "/:apeKeyId",
  RateLimit.apeKeysDelete,
  authenticateRequest(),
  checkIfUserCanManageApeKeys,
  validateRequest({
    params: {
      apeKeyId: joi.string().required(),
    },
  }),
  asyncHandler(ApeKeyController.deleteApeKey)
);

export default router;
