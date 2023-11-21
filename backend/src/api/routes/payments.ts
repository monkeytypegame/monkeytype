import joi from "joi";
import { Router } from "express";
import {
  asyncHandler,
  validateRequest,
  validateConfiguration,
} from "../../middlewares/api-utils";
import * as PaymentsController from "../controllers/payments";
import { authenticateRequest } from "../../middlewares/auth";

const router = Router();

router.post(
  "/checkouts",
  validateConfiguration({
    criteria: (configuration) => {
      return configuration.users.premium.enabled;
    },
    invalidMessage: "Premium is temporarily disabled.",
  }),
  authenticateRequest(),
  validateRequest({
    body: {
      items: joi
        .array()
        .items(
          joi.object({
            lookupKey: joi.string().required().not().empty(),
          })
        )
        .required()
        .min(1)
        .max(1), //currently we only support one item per checkout
    },
  }),
  asyncHandler(PaymentsController.createCheckout)
);

export default router;
