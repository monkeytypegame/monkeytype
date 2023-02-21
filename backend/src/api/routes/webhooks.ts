import { Router } from "express";
import joi from "joi";
import { asyncHandler, validateRequest } from "../../middlewares/api-utils";
import { authenticateRequest } from "../../middlewares/auth";
import * as RateLimit from "../../middlewares/rate-limit";
import * as WebhookController from "../controllers/webhook";

const router = Router();

router.post(
  "/releases",
  authenticateRequest({
    webhookType: "GitHub",
  }),
  RateLimit.webhooksPost,
  validateRequest({
    body: {
      action: joi.string().equal("published").required(),
      release: joi
        .object({
          id: joi.number().required(),
        })
        .unknown(true)
        .required(),
      repository: joi.object().unknown(true).required(),
      sender: joi.object().unknown(true).required(),
    },
  }),
  asyncHandler(WebhookController.sendRelease)
);

export default router;
