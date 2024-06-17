import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth";
import {
  asyncHandler,
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
    invalidMessage: "Development endpoints are only available in DEV mode.",
  })
);

router.post(
  "/generateData",
  authenticateRequest(),
  validateRequest({
    body: {
      username: joi.string().required(),
      createUser: joi.boolean().optional(),
      firstTestTimestamp: joi.number().optional(),
      lastTestTimestamp: joi.number().optional(),
      minTestsPerDay: joi.number().optional(),
      maxTestsPerDay: joi.number().optional(),
    },
  }),
  asyncHandler(createTestData)
);

export default router;
