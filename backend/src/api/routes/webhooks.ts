// import joi from "joi";
import { Router } from "express";
import { authenticateGithubWebhook } from "../../middlewares/auth";
import { asyncHandler } from "../../middlewares/api-utils";
import { webhookLimit } from "../../middlewares/rate-limit";
import { githubRelease } from "../controllers/webhooks";

const router = Router();

router.post(
  "/githubRelease",
  webhookLimit,
  authenticateGithubWebhook(),
  asyncHandler(githubRelease)
);

export default router;
