const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const PresetController = require("../controllers/preset");
const RateLimit = require("../../middlewares/rate-limit");
const configSchema = require("../schemas/config-schema");
const {
  asyncHandlerWrapper,
  requestValidation,
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
  asyncHandlerWrapper(PresetController.getPresets)
);

router.post(
  "/add",
  RateLimit.presetsAdd,
  authenticateRequest(),
  requestValidation({
    body: {
      name: presetNameSchema,
      config: configSchema.keys({
        tags: joi.array().items(joi.string()),
      }),
    },
  }),
  asyncHandlerWrapper(PresetController.addPreset)
);

router.post(
  "/edit",
  RateLimit.presetsEdit,
  authenticateRequest(),
  requestValidation({
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
  asyncHandlerWrapper(PresetController.editPreset)
);

router.post(
  "/remove",
  RateLimit.presetsRemove,
  authenticateRequest(),
  requestValidation({
    body: {
      _id: joi.string().required(),
    },
  }),
  asyncHandlerWrapper(PresetController.removePreset)
);

module.exports = router;
