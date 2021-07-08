import { authenticateRequest } from "../../middlewares/auth";
import PresetController from "../controllers/preset";

const { Router } = require("express");

const router = Router();

router.post("/presets/add", authenticateRequest, PresetController.addPreset);

router.post("/presets/edit", authenticateRequest, PresetController.editPreset);

router.get(
  "/presets/remove",
  authenticateRequest,
  PresetController.removePreset
);

module.exports = router;
