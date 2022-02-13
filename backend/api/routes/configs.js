const { Router } = require("express");
const { authenticateRequest } = require("../../middlewares/auth");
const {
  asyncHandler,
  validateRequest,
} = require("../../middlewares/api-utils");
const configSchema = require("../schemas/config-schema");
const ConfigController = require("../controllers/config");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/",
  RateLimit.configGet,
  authenticateRequest(),
  asyncHandler(ConfigController.getConfig)
);

router.post(
  "/save",
  RateLimit.configUpdate,
  authenticateRequest(),
  validateRequest({
    body: {
      config: configSchema,
    },
  }),
  asyncHandler(ConfigController.saveConfig)
);

module.exports = router;
