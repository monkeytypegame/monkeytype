import { Router } from "express";
import joi from "joi";
import { createTestData } from "../controllers/dev";
import { isDevEnvironment } from "../../utils/misc";
import { validateConfiguration } from "../../middlewares/configuration";
import { validateRequest } from "../../middlewares/validation";
import { asyncHandler } from "../../middlewares/utility";

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
