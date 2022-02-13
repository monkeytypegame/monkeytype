const PsaController = require("../controllers/psa");
const RateLimit = require("../../middlewares/rate-limit");
const { asyncHandler } = require("../../middlewares/api-utils");

const { Router } = require("express");

const router = Router();

router.get("/", RateLimit.psaGet, asyncHandler(PsaController.get));

module.exports = router;
