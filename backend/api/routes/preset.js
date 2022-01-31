const { authenticateRequest } = require("../../middlewares/auth");
const PresetController = require("../controllers/preset");
const RateLimit = require("../../middlewares/rate-limit");

const { Router } = require("express");

const router = Router();

router.get(
  "/",
  RateLimit.presetsGet,
  authenticateRequest,
  PresetController.getPresets
);

router.post(
  "/add",
  RateLimit.presetsAdd,
  authenticateRequest,
  PresetController.addPreset
);

router.post(
  "/edit",
  RateLimit.presetsEdit,
  authenticateRequest,
  PresetController.editPreset
);

router.post(
  "/remove",
  RateLimit.presetsRemove,
  authenticateRequest,
  PresetController.removePreset
);

module.exports = router;
