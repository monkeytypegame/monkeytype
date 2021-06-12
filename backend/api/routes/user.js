import { authenticateRequest } from "../../middlewares/auth";

const { Router } = require("express");
import UserController from "../controllers/user";

const router = Router();

router.post("/user/signup", UserController.createNewUser);

router.post("/user/updateName", authenticateRequest, UserController.updateName);

router.get("/user", authenticateRequest, UserController.getUser);

module.exports = router;
