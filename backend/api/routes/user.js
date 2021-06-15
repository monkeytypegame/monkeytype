const { authenticateRequest } = require("../../middlewares/auth");

const { Router } = require("express");
const UserController = require("../controllers/user");

const router = Router();

router.post("/user/signup", UserController.createNewUser);

router.post("/user/checkName", authenticateRequest, UserController.checkName);

router.post("/user/updateName", authenticateRequest, UserController.updateName);

router.get("/user", authenticateRequest, UserController.getUser);

module.exports = router;
