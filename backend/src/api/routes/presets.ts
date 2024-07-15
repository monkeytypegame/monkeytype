import joi from "joi";
import { authenticateRequest } from "../../middlewares/auth";
import * as PresetController from "../controllers/preset";
import * as RateLimit from "../../middlewares/rate-limit";
import configSchema from "../schemas/config-schema";
import { Router } from "express";
import { asyncHandler } from "../../middlewares/utility";
import { validateRequest } from "../../middlewares/validation";

const router = Router();

const presetNameSchema = joi
  .string()
  .required()
  .regex(/^[0-9a-zA-Z_-]+$/)
  .max(16)
  .messages({
    "string.pattern.base": "Invalid preset name",
    "string.max": "Preset name exceeds maximum of 16 characters",
  });

router.get(
  "/",
  authenticateRequest(),
  RateLimit.presetsGet,
  asyncHandler(PresetController.getPresets)
);

router.post(
  "/",
  authenticateRequest(),
  RateLimit.presetsAdd,
  validateRequest({
    body: {
      name: presetNameSchema,
      config: configSchema.keys({
        tags: joi.array().items(joi.string().token().max(50)),
      }),
    },
  }),
  asyncHandler(PresetController.addPreset)
);

router.patch(
  "/",
  authenticateRequest(),
  RateLimit.presetsEdit,
  validateRequest({
    body: {
      _id: joi.string().token().required(),
      name: presetNameSchema,
      config: configSchema
        .keys({
          tags: joi.array().items(joi.string().token().max(50)),
        })
        .allow(null),
    },
  }),
  asyncHandler(PresetController.editPreset)
);

router.delete(
  "/:presetId",
  authenticateRequest(),
  RateLimit.presetsRemove,
  validateRequest({
    params: {
      presetId: joi.string().token().required(),
    },
  }),
  asyncHandler(PresetController.removePreset)
);

export default router;
