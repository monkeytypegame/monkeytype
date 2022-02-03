const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ConfigController = require("../controllers/config");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandlerWrapper,
  requestValidation,
} = require("../../middlewares/api-utils");

const router = Router();

router.get(
  "/",
  RateLimit.configGet,
  authenticateRequest,
  asyncHandlerWrapper(ConfigController.getConfig)
);

router.post(
  "/save",
  RateLimit.configUpdate,
  authenticateRequest,
  asyncHandlerWrapper(ConfigController.saveConfig)
);

module.exports = router;
