const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");

const router = Router();

router.post("/test", authenticateRequest);
