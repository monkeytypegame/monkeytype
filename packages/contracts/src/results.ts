import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  CommonResponses,
  meta,
  MonkeyResponseSchema,
  responseWithData,
} from "./schemas/api";
import {
  CompletedEventSchema,
  PostResultResponseSchema,
  ResultSchema,
} from "./schemas/results";
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
  PostResultResponseSchema
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
      description: "Gets up to 1000 results",
      method: "GET",
      path: "",
      query: GetResultsQuerySchema.strict(),
      responses: {
        200: GetResultsResponseSchema,
      },
      metadata: meta({
        authenticationOptions: {
          acceptApeKeys: true,
        },
        rateLimit: {
          normal: "resultsGet",
          apeKey: "resultsGetApe",
        },
      }),
    },
    add: {
      summary: "add result",
      description: "Add a test result for the current user",
      method: "POST",
      path: "",
      body: AddResultRequestSchema.strict(),
      responses: {
        200: AddResultResponseSchema,
      },
      metadata: meta({
        rateLimit: "resultsAdd",
        requireConfiguration: {
          path: "results.savingEnabled",
          invalidMessage: "Results are not being saved at this time.",
        },
      }),
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
      metadata: meta({
        rateLimit: "resultsTagsUpdate",
      }),
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
      metadata: meta({
        authenticationOptions: {
          requireFreshToken: true,
        },
        rateLimit: "resultsDeleteAll",
      }),
    },
    getLast: {
      summary: "get last result",
      description: "Gets a user's last saved result",
      path: "/last",
      method: "GET",
      responses: {
        200: GetLastResultResponseSchema,
      },
      metadata: meta({
        authenticationOptions: {
          acceptApeKeys: true,
        },
        rateLimit: "resultsGet",
      }),
    },
  },
  {
    pathPrefix: "/results",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "results",
    }),
    commonResponses: CommonResponses,
  }
);
