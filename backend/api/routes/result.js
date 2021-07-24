const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ResultController = require("../controllers/result");

const router = Router();

router.get("/", authenticateRequest, ResultController.getResults);

router.post("/add", authenticateRequest, ResultController.addResult);

router.post("/updateTags", authenticateRequest, ResultController.updateTags);

router.post("/deleteAll", authenticateRequest, ResultController.deleteAll);

module.exports = router;
