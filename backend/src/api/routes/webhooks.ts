// import joi from "joi";
import { webhooksContract } from "@monkeytype/contracts/webhooks";
import { initServer } from "@ts-rest/express";
import * as WebhooksController from "../controllers/webhooks";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(webhooksContract, {
  postGithubRelease: {
    handler: async (r) => callController(WebhooksController.githubRelease)(r),
  },
});
