const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const UserController = require("../controllers/user");

const router = Router();

router.get("/", authenticateRequest, UserController.getUser);

router.post("/signup", UserController.createNewUser);

router.post("/checkName", UserController.checkName);

router.post("/delete", authenticateRequest, UserController.deleteUser);

router.post("/updateName", authenticateRequest, UserController.updateName);

router.post("/updateEmail", authenticateRequest, UserController.updateEmail);

router.post("/clearPb", authenticateRequest, UserController.clearPb);

router.post("/tags/add", authenticateRequest, UserController.addTag);

router.get("/tags", authenticateRequest, UserController.getTags);

router.post("/tags/clearPb", authenticateRequest, UserController.clearTagPb);

router.post("/tags/remove", authenticateRequest, UserController.removeTag);

router.post("/tags/edit", authenticateRequest, UserController.editTag);

router.post("/discord/link", authenticateRequest, UserController.linkDiscord);

router.post(
  "/discord/unlink",
  authenticateRequest,
  UserController.unlinkDiscord
);

module.exports = router;
