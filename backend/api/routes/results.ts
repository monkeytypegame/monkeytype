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

const router = Router();

router.get(
  "/",
  RateLimit.resultsGet,
  authenticateRequest(),
  asyncHandler(ResultController.getResults)
);

router.post(
  "/",
  validateConfiguration({
    criteria: (configuration) => {
      return configuration.enableSavingResults.enabled;
    },
    invalidMessage: "Results are not being saved at this time.",
  }),
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
      resultId: joi.string().required(),
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

export default router;
