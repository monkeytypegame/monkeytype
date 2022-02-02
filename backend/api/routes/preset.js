const { authenticateRequest } = require("../../middlewares/auth");
const PresetController = require("../controllers/preset");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandlerWrapper,
  requestValidation,
} = require("../../middlewares/api-utils");

const { Router } = require("express");

const router = Router();

router.get(
  "/",
  RateLimit.presetsGet,
  authenticateRequest,
  asyncHandlerWrapper(PresetController.getPresets)
);

router.post(
  "/add",
  RateLimit.presetsAdd,
  authenticateRequest,
  asyncHandlerWrapper(PresetController.addPreset)
);

router.post(
  "/edit",
  RateLimit.presetsEdit,
  authenticateRequest,
  asyncHandlerWrapper(PresetController.editPreset)
);

router.post(
  "/remove",
  RateLimit.presetsRemove,
  authenticateRequest,
  asyncHandlerWrapper(PresetController.removePreset)
);

module.exports = router;
