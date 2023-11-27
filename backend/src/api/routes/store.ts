import joi from "joi";
import { Router } from "express";
import {
  asyncHandler,
  validateRequest,
  validateConfiguration,
} from "../../middlewares/api-utils";
import * as StoreController from "../controllers/store";
import { authenticateRequest } from "../../middlewares/auth";

const router = Router();

const validateFeatureEnabled = validateConfiguration({
  criteria: (configuration) => {
    return configuration.users.premium.enabled;
  },
  invalidMessage: "Premium is temporarily disabled.",
});

router.post(
  "/startCheckout",
  validateFeatureEnabled,
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
  asyncHandler(StoreController.createCheckout)
);
router.post(
  "/finishCheckout/:stripeSessionId",
  validateFeatureEnabled,
  authenticateRequest(),
  validateRequest({
    params: {
      stripeSessionId: joi.string().required(),
    },
  }),
  asyncHandler(StoreController.finalizeCheckout)
);

export default router;
