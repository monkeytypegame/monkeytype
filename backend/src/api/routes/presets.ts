import joi from "joi";
import { authenticateRequest } from "../../middlewares/auth";
import * as PresetController from "../controllers/preset";
import * as RateLimit from "../../middlewares/rate-limit";
import configSchema from "../schemas/config-schema";
import { asyncHandler, validateRequest } from "../../middlewares/api-utils";
import { Router } from "express";

const router = Router();

const presetNameSchema = joi
  .string()
  .required()
  .regex(/^[0-9a-zA-Z_.-]+$/)
  .max(16)
  .messages({
    "string.pattern.base": "Invalid preset name",
    "string.max": "Preset name exceeds maximum of 16 characters",
  });

router.get(
  "/",
  RateLimit.presetsGet,
  authenticateRequest(),
  asyncHandler(PresetController.getPresets)
);

router.post(
  "/",
  RateLimit.presetsAdd,
  authenticateRequest(),
  validateRequest({
    body: {
      name: presetNameSchema,
      config: configSchema.keys({
        tags: joi.array().items(joi.string()),
      }),
    },
  }),
  asyncHandler(PresetController.addPreset)
);

router.patch(
  "/",
  RateLimit.presetsEdit,
  authenticateRequest(),
  validateRequest({
    body: {
      _id: joi.string().required(),
      name: presetNameSchema,
      config: configSchema
        .keys({
          tags: joi.array().items(joi.string()),
        })
        .allow(null),
    },
  }),
  asyncHandler(PresetController.editPreset)
);

router.delete(
  "/:presetId",
  RateLimit.presetsRemove,
  authenticateRequest(),
  validateRequest({
    params: {
      presetId: joi.string().required(),
    },
  }),
  asyncHandler(PresetController.removePreset)
);

export default router;
