const { authenticateRequest } = require("../../middlewares/auth");
const PresetController = require("../controllers/preset");

const { Router } = require("express");

const router = Router();

router.get("/", authenticateRequest, PresetController.getPresets);

router.post("/add", authenticateRequest, PresetController.addPreset);

router.post("/edit", authenticateRequest, PresetController.editPreset);

router.post("/remove", authenticateRequest, PresetController.removePreset);

module.exports = router;
