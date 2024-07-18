import * as ResultController from "../controllers/result.js";
import resultSchema from "../schemas/result-schema.js";
import * as RateLimit from "../../middlewares/rate-limit.js";
import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth.js";
import joi from "joi";
import { withApeRateLimiter } from "../../middlewares/ape-rate-limit.js";
import { validateRequest } from "../../middlewares/validation.js";
import { asyncHandler } from "../../middlewares/utility.js";
import { validate } from "../../middlewares/configuration.js";

const router = Router();

router.get(
  "/",
  authenticateRequest({
    acceptApeKeys: true,
  }),
  withApeRateLimiter(RateLimit.resultsGet, RateLimit.resultsGetApe),
  validateRequest({
    query: {
      onOrAfterTimestamp: joi.number().integer().min(1589428800000),
      limit: joi.number().integer().min(0).max(1000),
      offset: joi.number().integer().min(0),
    },
  }),
  asyncHandler(ResultController.getResults)
);

router.post(
  "/",
  validate({
    criteria: (configuration) => {
      return configuration.results.savingEnabled;
    },
    invalidMessage: "Results are not being saved at this time.",
  }),
  authenticateRequest(),
  RateLimit.resultsAdd,
  validateRequest({
    body: {
      result: resultSchema,
    },
  }),
  asyncHandler(ResultController.addResult)
);

router.patch(
  "/tags",
  authenticateRequest(),
  RateLimit.resultsTagsUpdate,
  validateRequest({
    body: {
      tagIds: joi
        .array()
        .items(joi.string().regex(/^[a-f\d]{24}$/i))
        .required(),
      resultId: joi
        .string()
        .regex(/^[a-f\d]{24}$/i)
        .required(),
    },
  }),
  asyncHandler(ResultController.updateTags)
);

router.delete(
  "/",
  authenticateRequest({
    requireFreshToken: true,
  }),
  RateLimit.resultsDeleteAll,
  asyncHandler(ResultController.deleteAll)
);

router.get(
  "/last",
  authenticateRequest({
    acceptApeKeys: true,
  }),
  withApeRateLimiter(RateLimit.resultsGet),
  asyncHandler(ResultController.getLastResult)
);

export default router;
