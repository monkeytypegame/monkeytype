const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const PresetController = require("../controllers/preset");
const RateLimit = require("../../middlewares/rate-limit");
const configSchema = require("../schemas/config-schema");
const {
  asyncHandler,
  validateRequest,
} = require("../../middlewares/api-utils");

const { Router } = require("express");

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
  "/add",
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

router.post(
  "/edit",
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

router.post(
  "/remove",
  RateLimit.presetsRemove,
  authenticateRequest(),
  validateRequest({
    body: {
      _id: joi.string().required(),
    },
  }),
  asyncHandler(PresetController.removePreset)
);

module.exports = router;
