const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const UserController = require("../controllers/user");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/",
  RateLimit.limit120perhour,
  authenticateRequest,
  UserController.getUser
);

router.post(
  "/signup",
  RateLimit.limit3perday,
  authenticateRequest,
  UserController.createNewUser
);

router.post("/checkName", RateLimit.limit1persec, UserController.checkName);

router.post(
  "/delete",
  RateLimit.limit3perday,
  authenticateRequest,
  UserController.deleteUser
);

router.post(
  "/updateName",
  RateLimit.limit3perday,
  authenticateRequest,
  UserController.updateName
);

router.post(
  "/updateLbMemory",
  RateLimit.limit1persec,
  authenticateRequest,
  UserController.updateLbMemory
);

router.post(
  "/updateEmail",
  RateLimit.limit60perhour,
  authenticateRequest,
  UserController.updateEmail
);

router.post(
  "/clearPb",
  RateLimit.limit60perhour,
  authenticateRequest,
  UserController.clearPb
);

router.post(
  "/tags/add",
  RateLimit.limit60perhour,
  authenticateRequest,
  UserController.addTag
);

router.get(
  "/tags",
  RateLimit.limit60perhour,
  authenticateRequest,
  UserController.getTags
);

router.post(
  "/tags/clearPb",
  RateLimit.limit60perhour,
  authenticateRequest,
  UserController.clearTagPb
);

router.post(
  "/tags/remove",
  RateLimit.limit60perhour,
  authenticateRequest,
  UserController.removeTag
);

router.post(
  "/tags/edit",
  RateLimit.limit60perhour,
  authenticateRequest,
  UserController.editTag
);

router.post(
  "/discord/link",
  RateLimit.limit60perhour,
  authenticateRequest,
  UserController.linkDiscord
);

router.post(
  "/discord/unlink",
  RateLimit.limit60perhour,
  authenticateRequest,
  UserController.unlinkDiscord
);

module.exports = router;
