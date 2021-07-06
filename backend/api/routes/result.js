const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ResultController = require("../controllers/result");

const router = Router();

router.get("/", authenticateRequest, ResultController.getResults);

module.exports = router;
