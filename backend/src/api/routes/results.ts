import * as ResultController from "../controllers/result";
import resultSchema from "../schemas/result-schema";
import {
  asyncHandler,
  validateRequest,
  validateConfiguration,
} from "../../middlewares/api-utils";
import * as RateLimit from "../../middlewares/rate-limit";
import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth";
import joi from "joi";
import {
  withApeRateLimiter,
  withCustomApeRateLimiter,
} from "../../middlewares/ape-rate-limit";

const router = Router();

router.get(
  "/",
  authenticateRequest({
    acceptApeKeys: true,
  }),
  withCustomApeRateLimiter(RateLimit.resultsGet_ape, RateLimit.resultsGet),
  asyncHandler(ResultController.getResults)
);

router.post(
  "/",
  validateConfiguration({
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
      tagIds: joi.array().items(joi.string()).required(),
      resultId: joi.string().required(),
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
