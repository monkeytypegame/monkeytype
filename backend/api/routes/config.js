const { Router } = require("express");
const { authenticateRequest } = require("../../middlewares/auth");
const {
  asyncHandlerWrapper,
  requestValidation,
} = require("../../middlewares/api-utils");
const configSchema = require("../schemas/config-schema");
const ConfigController = require("../controllers/config");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/",
  RateLimit.configGet,
  authenticateRequest(),
  asyncHandlerWrapper(ConfigController.getConfig)
);

router.post(
  "/save",
  RateLimit.configUpdate,
  authenticateRequest(),
  requestValidation({
    body: {
      config: configSchema,
    },
  }),
  asyncHandlerWrapper(ConfigController.saveConfig)
);

module.exports = router;
