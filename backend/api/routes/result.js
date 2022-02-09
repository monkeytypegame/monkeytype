import ResultController from "../controllers/result";

import resultSchema from "../schemas/result-schema";
import { asyncHandler, validateRequest } from "../../middlewares/api-utils";
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
  "/add",
  RateLimit.resultsAdd,
  authenticateRequest(),
  validateRequest({
    body: {
      result: resultSchema,
    },
  }),
  asyncHandler(ResultController.addResult)
);

router.post(
  "/updateTags",
  RateLimit.resultsTagsUpdate,
  authenticateRequest(),
  validateRequest({
    body: {
      tags: joi.array().items(joi.string()).required(),
      resultid: joi.string().required(),
    },
  }),
  asyncHandler(ResultController.updateTags)
);

router.post(
  "/deleteAll",
  RateLimit.resultsDeleteAll,
  authenticateRequest(),
  asyncHandler(ResultController.deleteAll)
);

export default router;
