const joi = require("joi");
const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const ResultController = require("../controllers/result");
const RateLimit = require("../../middlewares/rate-limit");
const {
  asyncHandlerWrapper,
  requestValidation,
} = require("../../middlewares/api-utils");
const resultSchema = require("../schemas/result-schema");

const router = Router();

router.get(
  "/",
  RateLimit.resultsGet,
  authenticateRequest(),
  asyncHandlerWrapper(ResultController.getResults)
);

router.post(
  "/add",
  RateLimit.resultsAdd,
  authenticateRequest(),
  requestValidation({
    body: {
      result: resultSchema,
    },
  }),
  asyncHandlerWrapper(ResultController.addResult)
);

router.post(
  "/updateTags",
  RateLimit.resultsTagsUpdate,
  authenticateRequest(),
  requestValidation({
    body: {
      tags: joi.array().items(joi.string()).required(),
      resultid: joi.string().required(),
    },
  }),
  asyncHandlerWrapper(ResultController.updateTags)
);

router.post(
  "/deleteAll",
  RateLimit.resultsDeleteAll,
  authenticateRequest(),
  asyncHandlerWrapper(ResultController.deleteAll)
);

module.exports = router;
