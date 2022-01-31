const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ConfigController = require("../controllers/config");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/",
  RateLimit.configGet,
  authenticateRequest,
  ConfigController.getConfig
);

router.post(
  "/save",
  RateLimit.configUpdate,
  authenticateRequest,
  ConfigController.saveConfig
);

module.exports = router;
