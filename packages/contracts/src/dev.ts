import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  CommonResponses,
  meta,
  MonkeyResponseSchema,
  responseWithData,
} from "./util/api";
import { IdSchema } from "@monkeytype/schemas/util";

export const GenerateDataRequestSchema = z.object({
  username: z.string(),
  createUser: z
    .boolean()
    .optional()
    .describe(
      "If `true` create user with <username>@example.com and password `password`. If false user has to exist.",
    ),
  firstTestTimestamp: z.number().int().nonnegative().optional(),
  lastTestTimestamp: z.number().int().nonnegative().optional(),
  minTestsPerDay: z.number().int().nonnegative().optional(),
  maxTestsPerDay: z.number().int().nonnegative().optional(),
});
export type GenerateDataRequest = z.infer<typeof GenerateDataRequestSchema>;

export const GenerateDataResponseSchema = responseWithData(
  z.object({
    uid: IdSchema,
    email: z.string().email(),
  }),
);
export type GenerateDataResponse = z.infer<typeof GenerateDataResponseSchema>;

export const AddDebugInboxItemRequestSchema = z.object({
  rewardType: z.enum(["xp", "badge", "none"]),
});
export type AddDebugInboxItemRequest = z.infer<
  typeof AddDebugInboxItemRequestSchema
>;

const c = initContract();
export const devContract = c.router(
  {
    generateData: {
      summary: "generate data",
      description: "Generate test results for the given user.",
      method: "POST",
      path: "/generateData",
      body: GenerateDataRequestSchema.strict(),
      responses: {
        200: GenerateDataResponseSchema,
      },
    },
    addDebugInboxItem: {
      summary: "add debug inbox item",
      description: "Add a debug inbox item with optional reward.",
      method: "POST",
      path: "/addDebugInboxItem",
      body: AddDebugInboxItemRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: meta({
        openApiTags: "development",
      }),
    },
  },
  {
    pathPrefix: "/dev",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "development",
      authenticationOptions: {
        isPublicOnDev: true,
      },
    }),
    commonResponses: CommonResponses,
  },
);
