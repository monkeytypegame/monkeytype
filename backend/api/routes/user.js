const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const UserController = require("../controllers/user");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/",
  RateLimit.userGet,
  authenticateRequest,
  UserController.getUser
);

router.post(
  "/signup",
  RateLimit.userSignup,
  authenticateRequest,
  UserController.createNewUser
);

router.post("/checkName", RateLimit.userCheckName, UserController.checkName);

router.post(
  "/delete",
  RateLimit.userDelete,
  authenticateRequest,
  UserController.deleteUser
);

router.post(
  "/updateName",
  RateLimit.userUpdateName,
  authenticateRequest,
  UserController.updateName
);

router.post(
  "/updateLbMemory",
  RateLimit.userUpdateLBMemory,
  authenticateRequest,
  UserController.updateLbMemory
);

router.post(
  "/updateEmail",
  RateLimit.userUpdateEmail,
  authenticateRequest,
  UserController.updateEmail
);

router.post(
  "/clearPb",
  RateLimit.userClearPB,
  authenticateRequest,
  UserController.clearPb
);

router.post(
  "/tags/add",
  RateLimit.userTagsAdd,
  authenticateRequest,
  UserController.addTag
);

router.get(
  "/tags",
  RateLimit.userTagsGet,
  authenticateRequest,
  UserController.getTags
);

router.post(
  "/tags/clearPb",
  RateLimit.userTagsClearPB,
  authenticateRequest,
  UserController.clearTagPb
);

router.post(
  "/tags/remove",
  RateLimit.userTagsRemove,
  authenticateRequest,
  UserController.removeTag
);

router.post(
  "/tags/edit",
  RateLimit.userTagsEdit,
  authenticateRequest,
  UserController.editTag
);

router.post(
  "/discord/link",
  RateLimit.userDiscordLink,
  authenticateRequest,
  UserController.linkDiscord
);

router.post(
  "/discord/unlink",
  RateLimit.userDiscordUnlink,
  authenticateRequest,
  UserController.unlinkDiscord
);

module.exports = router;
