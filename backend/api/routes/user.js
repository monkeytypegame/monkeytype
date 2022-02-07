const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const UserController = require("../controllers/user");
const RateLimit = require("../../middlewares/rate-limit");
const {
  validateRequester,
  requestValidation,
} = require("../../middlewares/api-utils");

const router = Router();

const tagNameValidation = joi
  .string()
  .required()
  .regex(/^[0-9a-zA-Z_.-]+$/)
  .max(16)
  .messages({
    "string.pattern.base":
      "Tag name invalid. Name cannot contain special characters or more than 16 characters. Can include _ . and -",
    "string.max": "Tag name exceeds maximum of 16 characters",
  });

router.get(
  "/",
  RateLimit.userGet,
  authenticateRequest(),
  asyncHandler(UserController.getUser)
);

router.post(
  "/signup",
  RateLimit.userSignup,
  authenticateRequest(),
  requestValidation({
    body: {
      email: joi.string().email(),
      name: joi.string().required(),
      uid: joi.string(),
    },
  }),
  asyncHandler(UserController.createNewUser)
);

router.get(
  "/checkName/:name",
  RateLimit.userCheckName,
  requestValidation({
    params: {
      name: joi.string().required(),
    },
  }),
  asyncHandler(UserController.checkName)
);

router.delete(
  "/",
  RateLimit.userDelete,
  authenticateRequest(),
  asyncHandler(UserController.deleteUser)
);

router.patch(
  "/name",
  RateLimit.userUpdateName,
  authenticateRequest(),
  requestValidation({
    body: {
      name: joi.string().required(),
    },
  }),
  asyncHandler(UserController.updateName)
);

router.patch(
  "/leaderboardMemory",
  RateLimit.userUpdateLBMemory,
  authenticateRequest(),
  requestValidation({
    body: {
      mode: joi
        .string()
        .valid("time", "words", "quote", "zen", "custom")
        .required(),
      mode2: joi.alternatives().try(joi.number(), joi.string()).required(),
      language: joi.string().required(),
      rank: joi.number().required(),
    },
  }),
  asyncHandler(UserController.updateLbMemory)
);

router.patch(
  "/email",
  RateLimit.userUpdateEmail,
  authenticateRequest(),
  requestValidation({
    body: {
      uid: joi.string().required(),
      newEmail: joi.string().email().required(),
      previousEmail: joi.string().email().required(),
    },
  }),
  asyncHandler(UserController.updateEmail)
);

router.delete(
  "/personalBests",
  RateLimit.userClearPB,
  authenticateRequest(),
  asyncHandler(UserController.clearPb)
);

router.get(
  "/tags",
  RateLimit.userTagsGet,
  authenticateRequest(),
  asyncHandler(UserController.getTags)
);

router.post(
  "/tags",
  RateLimit.userTagsAdd,
  authenticateRequest(),
  requestValidation({
    body: {
      tagName: tagNameValidation,
    },
  }),
  asyncHandler(UserController.addTag)
);

router.patch(
  "/tags",
  RateLimit.userTagsEdit,
  authenticateRequest(),
  requestValidation({
    body: {
      tagId: joi.string().required(),
      newName: tagNameValidation,
    },
  }),
  asyncHandler(UserController.editTag)
);

router.delete(
  "/tags/:tagId",
  RateLimit.userTagsRemove,
  authenticateRequest(),
  requestValidation({
    params: {
      tagId: joi.string().required(),
    },
  }),
  asyncHandler(UserController.removeTag)
);

router.delete(
  "/tags/:tagId/personalBest",
  RateLimit.userTagsClearPB,
  authenticateRequest(),
  requestValidation({
    params: {
      tagId: joi.string().required(),
    },
  }),
  asyncHandler(UserController.clearTagPb)
);

router.post(
  "/discord/link",
  RateLimit.userDiscordLink,
  authenticateRequest(),
  requestValidation({
    body: {
      data: joi.object({
        tokenType: joi.string().required(),
        accessToken: joi.string().required(),
        uid: joi.string().required(),
      }),
    },
  }),
  asyncHandler(UserController.linkDiscord)
);

router.post(
  "/discord/unlink",
  RateLimit.userDiscordUnlink,
  authenticateRequest(),
  asyncHandler(UserController.unlinkDiscord)
);

module.exports = router;
