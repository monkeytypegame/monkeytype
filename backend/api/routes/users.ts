import joi from "joi";
import { authenticateRequest } from "../../middlewares/auth";
import { Router } from "express";
import UserController from "../controllers/user";
import { asyncHandler, validateRequest } from "../../middlewares/api-utils";
import * as RateLimit from "../../middlewares/rate-limit";
import ApeRateLimit from "../../middlewares/ape-rate-limit";
import { isUsernameValid } from "../../utils/validation";

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

const usernameValidation = joi
  .string()
  .required()
  .custom((value, helpers) => {
    return isUsernameValid(value)
      ? value
      : helpers.error("string.pattern.base");
  })
  .messages({
    "string.pattern.base":
      "Username invalid. Name cannot contain special characters or contain more than 14 characters. Can include _ . and -",
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
  validateRequest({
    body: {
      email: joi.string().email(),
      name: usernameValidation,
      uid: joi.string(),
    },
  }),
  asyncHandler(UserController.createNewUser)
);

router.get(
  "/checkName/:name",
  RateLimit.userCheckName,
  validateRequest({
    params: {
      name: usernameValidation,
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
  validateRequest({
    body: {
      name: usernameValidation,
    },
  }),
  asyncHandler(UserController.updateName)
);

router.patch(
  "/leaderboardMemory",
  RateLimit.userUpdateLBMemory,
  authenticateRequest(),
  validateRequest({
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
  validateRequest({
    body: {
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
  validateRequest({
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
  validateRequest({
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
  validateRequest({
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
  validateRequest({
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
  validateRequest({
    body: {
      data: joi.object({
        tokenType: joi.string().required(),
        accessToken: joi.string().required(),
        uid: joi.string(),
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

router.get(
  "/personalBests",
  RateLimit.userGet,
  authenticateRequest({
    acceptApeKeys: true,
  }),
  ApeRateLimit,
  validateRequest({
    query: {
      mode: joi.string().required(),
      mode2: joi.string(),
    },
  }),
  asyncHandler(UserController.getPersonalBests)
);

export default router;
