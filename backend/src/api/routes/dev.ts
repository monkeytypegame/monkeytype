import { Router } from "express";
import joi from "joi";
import { createTestData } from "../controllers/dev.js";
import { isDevEnvironment } from "../../utils/misc.js";
import { validate } from "../../middlewares/configuration.js";
import { validateRequest } from "../../middlewares/validation.js";
import { asyncHandler } from "../../middlewares/utility.js";

const router = Router();

router.use(
  validate({
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
