const PsaController = require("../controllers/psa");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandlerWrapper,
  requestValidation,
} = require("../../middlewares/api-utils");

const { Router } = require("express");

const router = Router();

router.get("/", RateLimit.psaGet, asyncHandlerWrapper(PsaController.get));

module.exports = router;
