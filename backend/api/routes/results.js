const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ResultController = require("../controllers/result");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandler,
  validateRequest,
} = require("../../middlewares/api-utils");
const resultSchema = require("../schemas/result-schema");

const router = Router();

router.get(
  "/",
  RateLimit.resultsGet,
  authenticateRequest(),
  asyncHandler(ResultController.getResults)
);

router.post(
  "/",
  RateLimit.resultsAdd,
  authenticateRequest(),
  validateRequest({
    body: {
      result: resultSchema,
    },
  }),
  asyncHandler(ResultController.addResult)
);

router.patch(
  "/tags",
  RateLimit.resultsTagsUpdate,
  authenticateRequest(),
  validateRequest({
    body: {
      tagIds: joi.array().items(joi.string()).required(),
      resultIds: joi.string().required(),
    },
  }),
  asyncHandler(ResultController.updateTags)
);

router.delete(
  "/",
  RateLimit.resultsDeleteAll,
  authenticateRequest(),
  asyncHandler(ResultController.deleteAll)
);

module.exports = router;
