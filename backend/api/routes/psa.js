const { authenticateRequest } = require("../../middlewares/auth");
const PsaController = require("../controllers/psa");
const RateLimit = require("../../middlewares/rate-limit");

const { Router } = require("express");

const router = Router();

router.get("/", RateLimit.limit1persec, PsaController.get);

module.exports = router;
