const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ConfigController = require("../controllers/config");

const router = Router();

router.get("/", authenticateRequest, ConfigController.getConfig);

router.post("/save", authenticateRequest, ConfigController.saveConfig);

module.exports = router;
