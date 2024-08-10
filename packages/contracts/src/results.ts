import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  CommonResponses,
  EndpointMetadata,
  MonkeyResponseSchema,
  responseWithData,
} from "./schemas/api";
import { CompletedEventSchema, ResultSchema } from "./schemas/results";
import { IdSchema } from "./schemas/util";

export const GetResultsQuerySchema = z.object({
  onOrAfterTimestamp: z
    .number()
    .int()
    .min(1589428800000)
    .optional()
    .describe(
      "Timestamp of the earliest result to fetch. If omitted the most recent results are fetched."
    ),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Offset of the item at which to begin the response."),
  limit: z
    .number()
    .int()
    .nonnegative()
    .max(1000)
    .optional()
    .describe("Limit results to the given amount."),
});
export type GetResultsQuery = z.infer<typeof GetResultsQuerySchema>;

export const GetResultsResponseSchema = responseWithData(z.array(ResultSchema));
export type GetResultsResponse = z.infer<typeof GetResultsResponseSchema>;

export const AddResultRequestSchema = z.object({
  result: CompletedEventSchema,
});
export type AddResultRequest = z.infer<typeof AddResultRequestSchema>;

export const AddResultResponseSchema = responseWithData(
  z.object({
    isPb: z.boolean(),
    tagPbs: z.array(IdSchema),
    dailyLeaderboardRank: z.number().int().nonnegative().optional(),
    weeklyXpLeaderboardRank: z.number().int().nonnegative().optional(),
    xp: z.number().int().nonnegative(),
    dailyXpBonus: z.boolean(),
    xpBreakdown: z.record(z.string(), z.number().int().nonnegative()), //TODO define type for xpBreakdown
    streak: z.number().int().nonnegative(),
  })
);
export type AddResultResponse = z.infer<typeof AddResultResponseSchema>;

export const UpdateResultTagsRequestSchema = z.object({
  tagIds: z.array(IdSchema),
  resultId: IdSchema,
});
export type UpdateResultTagsRequest = z.infer<
  typeof UpdateResultTagsRequestSchema
>;
export const UpdateResultTagsResponseSchema = responseWithData(
  z.object({
    tagPbs: z.array(IdSchema),
  })
);
export type UpdateResultTagsResponse = z.infer<
  typeof UpdateResultTagsResponseSchema
>;

export const GetLastResultResponseSchema = responseWithData(ResultSchema);
export type GetLastResultResponse = z.infer<typeof GetLastResultResponseSchema>;

const c = initContract();
export const resultsContract = c.router(
  {
    get: {
      summary: "get results",
      description:
        "Gets up to 1000 results (endpoint limited to 30 requests per day)",
      method: "GET",
      path: "",
      query: GetResultsQuerySchema.strict(),
      responses: {
        200: GetResultsResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          acceptApeKeys: true,
        },
      } as EndpointMetadata,
    },
    add: {
      summary: "add result",
      description: "add a test result for the current user",
      method: "POST",
      path: "",
      body: AddResultRequestSchema,
      responses: {
        200: AddResultResponseSchema,
      },
    },
    updateTags: {
      summary: "update result tags",
      description: "Labels a result with the specified tags",
      method: "PATCH",
      path: "/tags",
      body: UpdateResultTagsRequestSchema.strict(),
      responses: {
        200: UpdateResultTagsResponseSchema,
      },
    },
    deleteAll: {
      summary: "delete all results",
      description: "Delete all results for the current user",
      method: "DELETE",
      path: "",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    getLast: {
      summary: "get last result",
      description: "Gets a user's last saved result",
      path: "/last",
      method: "GET",
      responses: {
        200: GetLastResultResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          acceptApeKeys: true,
        },
      } as EndpointMetadata,
    },
  },
  {
    pathPrefix: "/results",
    strictStatusCodes: true,
    metadata: {
      openApiTags: "results",
    } as EndpointMetadata,
    commonResponses: CommonResponses,
  }
);
