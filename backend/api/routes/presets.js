import { authenticateRequest } from "../../middlewares/auth";
import PresetsController from "../controllers/presets";

const { Router } = require("express");

const router = Router();

router.post("/presets/add", authenticateRequest, PresetsController.addPreset);

router.post("/presets/edit", authenticateRequest, PresetsController.editPreset);

router.get("/presets/remove", authenticateRequest, PresetsController.removePreset);

module.exports = router;
