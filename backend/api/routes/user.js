const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const UserController = require("../controllers/user");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandlerWrapper,
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
  asyncHandlerWrapper(UserController.getUser)
);

router.post(
  "/signup",
  RateLimit.userSignup,
  authenticateRequest(),
  requestValidation({
    body: {
      email: joi.string().email(),
      name: joi.string(),
      uid: joi.string().required(),
    },
  }),
  asyncHandlerWrapper(UserController.createNewUser)
);

router.post(
  "/checkName",
  RateLimit.userCheckName,
  requestValidation({
    body: {
      name: joi.string().required(),
    },
  }),
  asyncHandlerWrapper(UserController.checkName)
);

router.delete(
  "/",
  RateLimit.userDelete,
  authenticateRequest(),
  asyncHandlerWrapper(UserController.deleteUser)
);

router.post(
  "/updateName",
  RateLimit.userUpdateName,
  authenticateRequest(),
  requestValidation({
    body: {
      name: joi.string().required(),
    },
  }),
  asyncHandlerWrapper(UserController.updateName)
);

router.post(
  "/updateLbMemory",
  RateLimit.userUpdateLBMemory,
  authenticateRequest(),
  requestValidation({
    body: {
      mode: joi.string().required(),
      mode2: joi.string().required(),
      language: joi.string().required(),
      rank: joi.number().required(),
    },
  }),
  asyncHandlerWrapper(UserController.updateLbMemory)
);

router.post(
  "/updateEmail",
  RateLimit.userUpdateEmail,
  authenticateRequest(),
  requestValidation({
    body: {
      uid: joi.string().required(),
      email: joi.string().email().required(),
      previousEmail: joi.string().email().required(),
    },
  }),
  asyncHandlerWrapper(UserController.updateEmail)
);

router.post(
  "/clearPb",
  RateLimit.userClearPB,
  authenticateRequest(),
  asyncHandlerWrapper(UserController.clearPb)
);

router.get(
  "/tags",
  RateLimit.userTagsGet,
  authenticateRequest(),
  asyncHandlerWrapper(UserController.getTags)
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
  asyncHandlerWrapper(UserController.addTag)
);

router.patch(
  "/tags",
  RateLimit.userTagsEdit,
  authenticateRequest(),
  requestValidation({
    body: {
      tagid: joi.string().required(),
      newname: tagNameValidation,
    },
  }),
  asyncHandlerWrapper(UserController.editTag)
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
  asyncHandlerWrapper(UserController.removeTag)
);

router.post(
  "/tags/clearPb",
  RateLimit.userTagsClearPB,
  authenticateRequest(),
  requestValidation({
    body: {
      tagid: joi.string().required(),
    },
  }),
  asyncHandlerWrapper(UserController.clearTagPb)
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
  asyncHandlerWrapper(UserController.linkDiscord)
);

router.post(
  "/discord/unlink",
  RateLimit.userDiscordUnlink,
  authenticateRequest(),
  asyncHandlerWrapper(UserController.unlinkDiscord)
);

module.exports = router;
