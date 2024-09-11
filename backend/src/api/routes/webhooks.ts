// import joi from "joi";
import { webhooksContract } from "@monkeytype/contracts/webhooks";
import { initServer } from "@ts-rest/express";
import { authenticateGithubWebhook } from "../../middlewares/auth";
import * as WebhooksController from "../controllers/webhooks";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(webhooksContract, {
  postGithubRelease: {
    middleware: [authenticateGithubWebhook()],
    handler: async (r) => callController(WebhooksController.githubRelease)(r),
  },
});
