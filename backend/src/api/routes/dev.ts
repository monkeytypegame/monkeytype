import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth";
import {
  asyncHandler,
  checkIfUserIsAdmin,
  validateConfiguration,
  validateRequest,
} from "../../middlewares/api-utils";
import joi from "joi";
import { createTestData } from "../controllers/dev";
import { isDevEnvironment } from "../../utils/misc";

const router = Router();

router.use(
  validateConfiguration({
    criteria: () => {
      return isDevEnvironment();
    },
    invalidMessage: "Development endpoints are currently disabled.",
  })
);

router.post(
  "/testData",
  authenticateRequest(),
  validateRequest({
    body: {
      username: joi.string().required(),
      password: joi.string().required().min(6),
      firstTestTimestamp: joi.number().optional(),
      lastTestTimestamp: joi.number().optional(),
      minTestsPerDay: joi.number().optional(),
      maxTestsPerDay: joi.number().optional(),
    },
  }),
  asyncHandler(createTestData)
);

export default router;
