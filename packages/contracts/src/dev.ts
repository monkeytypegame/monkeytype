import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { CommonResponses, meta, responseWithData } from "./schemas/api";
import { IdSchema } from "./schemas/util";

export const GenerateDataRequestSchema = z.object({
  username: z.string(),
  createUser: z
    .boolean()
    .optional()
    .describe(
      "If `true` create user with <username>@example.com and password `password`. If false user has to exist."
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
  })
);
export type GenerateDataResponse = z.infer<typeof GenerateDataResponseSchema>;

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
  }
);
