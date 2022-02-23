const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const UserController = require("../controllers/user");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandler,
  validateRequest,
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
  validateRequest({
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
  validateRequest({
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
  validateRequest({
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

router.get(
  "/customThemes",
  RateLimit.userCustomThemeGet,
  authenticateRequest(),
  UserController.getCustomThemes
);

router.post(
  "/customThemes",
  RateLimit.userCustomThemeAdd,
  authenticateRequest(),
  validateRequest({
    body: {
      name: joi
        .string()
        .max(16)
        .regex(/^[0-9a-zA-Z_.-]+$/)
        .required()
        .messages({
          "string.max": "The name must not exceed 16 characters",
          "string.pattern.base":
            "The name can only contain numbers, alphabets and the following: _ . -",
        }),
      colors: joi
        .array()
        .items(
          joi
            .string()
            .length(7)
            .regex(/^[#][0-9a-fA-F]+$/)
            .messages({
              "string.pattern.base": "The colors must be valid hexadecimal",
              "string.length": "The colors must be 7 characters long",
            })
        )
        .length(9)
        .messages({
          "array.length": "The colors array must have 9 colors",
        }),
    },
  }),
  UserController.addCustomTheme
);

router.delete(
  "/customThemes",
  RateLimit.userCustomThemeRemove,
  authenticateRequest(),
  validateRequest({
    body: {
      themeID: joi
        .string()
        .length(24)
        .regex(/^[0-9a-fA-F]+$/)
        .required()
        .messages({
          "string.length": "The themeID must be 24 characters long",
          "string.pattern.base": "The themeID must be valid hexadecimal string",
        }),
    },
  }),
  UserController.removeCustomTheme
);

router.put(
  "/customThemes",
  RateLimit.userCustomThemeEdit,
  authenticateRequest(),
  validateRequest({
    body: {
      themeID: joi
        .string()
        .length(24)
        .regex(/^[0-9a-fA-F]+$/)
        .required()
        .messages({
          "string.length": "The themeID must be 24 characters long",
          "string.pattern.base": "The themeID must be valid hexadecimal string",
        }),
      theme: {
        name: joi
          .string()
          .max(16)
          .regex(/^[0-9a-zA-Z_.-]+$/)
          .required()
          .messages({
            "string.max": "The name must not exceed 16 characters",
            "string.pattern.base":
              "The name can only contain numbers, alphabets and the following: _ . -",
          }),
        colors: joi
          .array()
          .items(
            joi
              .string()
              .length(7)
              .regex(/^[#][0-9a-fA-F]+$/)
              .messages({
                "string.pattern.base": "The colors must be valid hexadecimal",
                "string.length": "The colors must be 7 characters long",
              })
          )
          .length(9)
          .messages({
            "array.length": "The colors array must have 9 colors",
          }),
      },
    },
  }),
  UserController.editCustomTheme
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
