const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const UserController = require("../controllers/user");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandlerWrapper,
  requestValidation,
} = require("../../middlewares/api-utils");

const router = Router();

router.get(
  "/",
  RateLimit.userGet,
  authenticateRequest,
  asyncHandlerWrapper(UserController.getUser)
);

router.post(
  "/signup",
  RateLimit.userSignup,
  authenticateRequest,
  asyncHandlerWrapper(UserController.createNewUser)
);

router.post(
  "/checkName",
  RateLimit.userCheckName,
  asyncHandlerWrapper(UserController.checkName)
);

router.post(
  "/delete",
  RateLimit.userDelete,
  authenticateRequest,
  asyncHandlerWrapper(UserController.deleteUser)
);

router.post(
  "/updateName",
  RateLimit.userUpdateName,
  authenticateRequest,
  asyncHandlerWrapper(UserController.updateName)
);

router.post(
  "/updateLbMemory",
  RateLimit.userUpdateLBMemory,
  authenticateRequest,
  asyncHandlerWrapper(UserController.updateLbMemory)
);

router.post(
  "/updateEmail",
  RateLimit.userUpdateEmail,
  authenticateRequest,
  asyncHandlerWrapper(UserController.updateEmail)
);

router.post(
  "/clearPb",
  RateLimit.userClearPB,
  authenticateRequest,
  asyncHandlerWrapper(UserController.clearPb)
);

router.post(
  "/tags/add",
  RateLimit.userTagsAdd,
  authenticateRequest,
  asyncHandlerWrapper(UserController.addTag)
);

router.get(
  "/tags",
  RateLimit.userTagsGet,
  authenticateRequest,
  asyncHandlerWrapper(UserController.getTags)
);

router.post(
  "/tags/clearPb",
  RateLimit.userTagsClearPB,
  authenticateRequest,
  asyncHandlerWrapper(UserController.clearTagPb)
);

router.post(
  "/tags/remove",
  RateLimit.userTagsRemove,
  authenticateRequest,
  asyncHandlerWrapper(UserController.removeTag)
);

router.post(
  "/tags/edit",
  RateLimit.userTagsEdit,
  authenticateRequest,
  asyncHandlerWrapper(UserController.editTag)
);

router.post(
  "/discord/link",
  RateLimit.userDiscordLink,
  authenticateRequest,
  asyncHandlerWrapper(UserController.linkDiscord)
);

router.post(
  "/discord/unlink",
  RateLimit.userDiscordUnlink,
  authenticateRequest,
  asyncHandlerWrapper(UserController.unlinkDiscord)
);

module.exports = router;
