const { authenticateRequest } = require("../../middlewares/auth");

const { Router } = require("express");
const UserController = require("../controllers/user");

const router = Router();

router.post("/signup", UserController.createNewUser);

router.post("/checkName", UserController.checkName);

router.post("/delete", UserController.deleteUser);

router.post("/user/updateName", authenticateRequest, UserController.updateName);

router.get("/", authenticateRequest, UserController.getUser);

module.exports = router;
