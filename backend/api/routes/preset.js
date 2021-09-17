const { authenticateRequest } = require("../../middlewares/auth");
const PresetController = require("../controllers/preset");
const RateLimit = require("../../middlewares/rate-limit");

const { Router } = require("express");

const router = Router();

router.get(
  "/",
  RateLimit.limit60perhour,
  authenticateRequest,
  PresetController.getPresets
);

router.post(
  "/add",
  RateLimit.limit60perhour,
  authenticateRequest,
  PresetController.addPreset
);

router.post(
  "/edit",
  RateLimit.limit60perhour,
  authenticateRequest,
  PresetController.editPreset
);

router.post(
  "/remove",
  RateLimit.limit60perhour,
  authenticateRequest,
  PresetController.removePreset
);

module.exports = router;
