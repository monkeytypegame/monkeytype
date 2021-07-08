const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const UserController = require("../controllers/user");

const router = Router();

router.post("/signup", UserController.createNewUser);

router.post("/checkName", UserController.checkName);

router.post("/delete", UserController.deleteUser);

router.post("/updateName", authenticateRequest, UserController.updateName);

router.get("/", authenticateRequest, UserController.getUser);

router.post("/tags/add", authenticateRequest, UserController.addTag);

router.get("/tags", authenticateRequest, UserController.getTags);

router.post("/tags/clearPb", authenticateRequest, UserController.clearTagPb);

router.post("/tags/remove", authenticateRequest, UserController.removeTag);

router.post("/tags/edit", authenticateRequest, UserController.editTag);

module.exports = router;
