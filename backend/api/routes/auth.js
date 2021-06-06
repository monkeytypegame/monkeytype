import { authenticateRequest } from "../../middlewares/auth";

const { Router } = require("express");
import AuthCtrl from "../controllers/auth";

const router = Router();

router.post("/signup", AuthCtrl.createNewUser);

router.post("/update/name", authenticateRequest, AuthCtrl.updateName);

router.get("/user", authenticateRequest, AuthCtrl.getUser);

module.exports = router;
