import { z } from "zod";
import {
  CommonResponses,
  EndpointMetadata,
  responseWithData,
} from "./schemas/api";
import {
  DailyLeaderboardRankSchema,
  LeaderboardEntrySchema,
  LeaderboardRankSchema,
} from "./schemas/leaderboards";
import { LanguageSchema } from "./schemas/util";
import { Mode2Schema, ModeSchema } from "./schemas/shared";
import { initContract } from "@ts-rest/core";

export const LanguageAndModeQuerySchema = z.object({
  language: LanguageSchema,
  mode: ModeSchema,
  mode2: Mode2Schema,
});
export type LanguageAndModeQuery = z.infer<typeof LanguageAndModeQuerySchema>;
const PaginationQuerySchema = z.object({
  skip: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().max(50).optional(),
});

export const GetLeaderboardQuerySchema = LanguageAndModeQuerySchema.merge(
  PaginationQuerySchema
);
export type GetLeaderboardQuery = z.infer<typeof GetLeaderboardQuerySchema>;
export const GetLeaderboardResponseSchema = responseWithData(
  z.array(LeaderboardEntrySchema)
);
export type GetLeaderboardResponse = z.infer<
  typeof GetLeaderboardResponseSchema
>;

export const GetLeaderboardRankResponseSchema = responseWithData(
  LeaderboardRankSchema
);
export type GetLeaderboardRankResponse = z.infer<
  typeof GetLeaderboardRankResponseSchema
>;

export const GetDailyLeaderboardRankQuerySchema =
  LanguageAndModeQuerySchema.extend({
    daysBefore: z.literal(1).optional(),
  });
export type GetDailyLeaderboardRankQuery = z.infer<
  typeof GetDailyLeaderboardRankQuerySchema
>;

export const GetDailyLeaderboardQuerySchema =
  GetDailyLeaderboardRankQuerySchema.merge(PaginationQuerySchema);
export type GetDailyLeaderboardQuery = z.infer<
  typeof GetDailyLeaderboardQuerySchema
>;

export const GetLeaderboardDailyRankResponseSchema = responseWithData(
  DailyLeaderboardRankSchema
);
export type GetLeaderboardDailyRankResponse = z.infer<
  typeof GetLeaderboardDailyRankResponseSchema
>;

const c = initContract();
export const leaderboardsContract = c.router(
  {
    get: {
      summary: "get leaderboard",
      description: "Get all-time leaderboard.",
      method: "GET",
      path: "/",
      query: GetLeaderboardQuerySchema.strict(),
      responses: {
        200: GetLeaderboardResponseSchema,
      },
      metadata: {
        authenticationOptions: { isPublic: true },
      } as EndpointMetadata,
    },
    getRank: {
      summary: "get leaderboard rank",
      description: "Get your rank on the all-time leaderboard",
      method: "GET",
      path: "/rank",
      query: LanguageAndModeQuerySchema.strict(),
      responses: {
        200: GetLeaderboardRankResponseSchema,
      },
      metadata: {
        authenticationOptions: { acceptApeKeys: true },
      } as EndpointMetadata,
    },
    getDaily: {
      summary: "get daily leaderboard",
      description: "Get daily leaderboard.",
      method: "GET",
      path: "/daily",
      query: GetDailyLeaderboardQuerySchema.strict(),
      responses: {
        200: GetLeaderboardResponseSchema,
      },
      metadata: {
        authenticationOptions: { isPublic: true },
      } as EndpointMetadata,
    },
    getDailyRank: {
      summary: "get daily leaderboard rank",
      description: "Get your rank on the daily leaderboard",
      method: "GET",
      path: "/daily/rank",
      query: GetDailyLeaderboardRankQuerySchema.strict(),
      responses: {
        200: GetLeaderboardDailyRankResponseSchema,
      },
    },
  },
  {
    pathPrefix: "/leaderboards",
    strictStatusCodes: true,
    metadata: {
      openApiTags: "leaderboards",
    } as EndpointMetadata,
    commonResponses: CommonResponses,
  }
);
