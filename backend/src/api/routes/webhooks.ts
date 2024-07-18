// import joi from "joi";
import { Router } from "express";
import { authenticateGithubWebhook } from "../../middlewares/auth.js";
import { asyncHandler } from "../../middlewares/utility.js";
import { webhookLimit } from "../../middlewares/rate-limit.js";
import { githubRelease } from "../controllers/webhooks.js";

const router = Router();

router.post(
  "/githubRelease",
  webhookLimit,
  authenticateGithubWebhook(),
  asyncHandler(githubRelease)
);

export default router;
