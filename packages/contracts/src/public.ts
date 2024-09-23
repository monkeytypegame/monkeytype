import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { CommonResponses, meta, responseWithData } from "./schemas/api";
import { SpeedHistogramSchema, TypingStatsSchema } from "./schemas/public";
import { Mode2Schema, ModeSchema } from "./schemas/shared";
import { LanguageSchema } from "./schemas/util";

export const GetSpeedHistogramQuerySchema = z
  .object({
    language: LanguageSchema,
    mode: ModeSchema,
    mode2: Mode2Schema,
  })
  .strict();
export type GetSpeedHistogramQuery = z.infer<
  typeof GetSpeedHistogramQuerySchema
>;

export const GetSpeedHistogramResponseSchema =
  responseWithData(SpeedHistogramSchema);
export type GetSpeedHistogramResponse = z.infer<
  typeof GetSpeedHistogramResponseSchema
>;

export const GetTypingStatsResponseSchema = responseWithData(TypingStatsSchema);
export type GetTypingStatsResponse = z.infer<
  typeof GetTypingStatsResponseSchema
>;

const c = initContract();
export const publicContract = c.router(
  {
    getSpeedHistogram: {
      summary: "get speed histogram",
      description:
        "get number of users personal bests grouped by wpm level (multiples of ten)",
      method: "GET",
      path: "/speedHistogram",
      query: GetSpeedHistogramQuerySchema,
      responses: {
        200: GetSpeedHistogramResponseSchema,
      },
    },

    getTypingStats: {
      summary: "get typing stats",
      description: "get number of tests and time users spend typing.",
      method: "GET",
      path: "/typingStats",
      responses: {
        200: GetTypingStatsResponseSchema,
      },
    },
  },
  {
    pathPrefix: "/public",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "public",
      authenticationOptions: {
        isPublic: true,
      },
      rateLimit: "publicStatsGet",
    }),
    commonResponses: CommonResponses,
  }
);
