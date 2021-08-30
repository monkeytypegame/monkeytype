const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ConfigController = require("../controllers/config");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/",
  RateLimit.limit60perhour,
  authenticateRequest,
  ConfigController.getConfig
);

router.post(
  "/save",
  RateLimit.limit500perhour,
  authenticateRequest,
  ConfigController.saveConfig
);

module.exports = router;
