import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { PSASchema } from "./schemas/psas";

import {
  CommonResponses,
  meta,
  MonkeyResponseSchema,
  responseWithData,
} from "./schemas/api";

/**
 *Schema: https://docs.github.com/en/webhooks/webhook-events-and-payloads?actionType=published#release
 We only specify the values we read and don't validate any other values.
 */
export const PostGithubReleaseRequestSchema = z.object({
  action: z.literal("published").or(z.string()),
  release: z
    .object({
      id: z.string().or(z.number().transform(String)), //we use string, github defines this as a number.
    })
    .optional(),
});
export type PostGithubReleaseRequest = z.infer<
  typeof PostGithubReleaseRequestSchema
>;

export const GetPsaResponseSchema = responseWithData(z.array(PSASchema));
export type GetPsaResponse = z.infer<typeof GetPsaResponseSchema>;

const c = initContract();
export const webhooksContract = c.router(
  {
    postGithubRelease: {
      summary: "Github release",
      description: "Announce github release.",
      method: "POST",
      path: "/githubRelease",
      body: PostGithubReleaseRequestSchema, //don't use strict
      headers: z.object({
        "x-hub-signature-256": z.string(),
      }),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
  },
  {
    pathPrefix: "/webhooks",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "webhooks",
      authenticationOptions: {
        isGithubWebhook: true,
      },
      rateLimit: "webhookLimit",
    }),
    commonResponses: CommonResponses,
  }
);
