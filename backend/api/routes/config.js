import { authenticateRequest } from "../../middlewares/auth";

const { Router } = require("express");
import ConfigController from "../controllers/auth";

const router = Router();

router.post("/config/save", authenticateRequest, ConfigController.saveConfig);

module.exports = router;
