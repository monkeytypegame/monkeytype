import { z } from "zod";
import {
  CommonResponses,
  meta,
  responseWithData,
  responseWithNullableData,
} from "./schemas/api";
import {
  DailyLeaderboardRankSchema,
  LeaderboardEntrySchema,
  LeaderboardRankSchema,
  XpLeaderboardEntrySchema,
  XpLeaderboardRankSchema,
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

export const GetWeeklyXpLeaderboardQuerySchema = PaginationQuerySchema.extend({
  weeksBefore: z.literal(1).optional(),
});
export type GetWeeklyXpLeaderboardQuery = z.infer<
  typeof GetWeeklyXpLeaderboardQuerySchema
>;

export const GetWeeklyXpLeaderboardResponseSchema = responseWithData(
  z.array(XpLeaderboardEntrySchema)
);
export type GetWeeklyXpLeaderboardResponse = z.infer<
  typeof GetWeeklyXpLeaderboardResponseSchema
>;

export const GetWeeklyXpLeaderboardRankResponseSchema =
  responseWithNullableData(XpLeaderboardRankSchema.partial());
export type GetWeeklyXpLeaderboardRankResponse = z.infer<
  typeof GetWeeklyXpLeaderboardRankResponseSchema
>;

const c = initContract();
export const leaderboardsContract = c.router(
  {
    get: {
      summary: "get leaderboard",
      description: "Get all-time leaderboard.",
      method: "GET",
      path: "",
      query: GetLeaderboardQuerySchema.strict(),
      responses: {
        200: GetLeaderboardResponseSchema,
      },
      metadata: meta({
        authenticationOptions: { isPublic: true },
      }),
    },
    getRank: {
      summary: "get leaderboard rank",
      description:
        "Get the rank of the current user on the all-time leaderboard",
      method: "GET",
      path: "/rank",
      query: LanguageAndModeQuerySchema.strict(),
      responses: {
        200: GetLeaderboardRankResponseSchema,
      },
      metadata: meta({
        authenticationOptions: { acceptApeKeys: true },
      }),
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
      metadata: meta({
        authenticationOptions: { isPublic: true },
        requireConfiguration: {
          path: "dailyLeaderboards.enabled",
          invalidMessage: "Daily leaderboards are not available at this time.",
        },
      }),
    },
    getDailyRank: {
      summary: "get daily leaderboard rank",
      description: "Get the rank of the current user on the daily leaderboard",
      method: "GET",
      path: "/daily/rank",
      query: GetDailyLeaderboardRankQuerySchema.strict(),
      responses: {
        200: GetLeaderboardDailyRankResponseSchema,
      },
      metadata: meta({
        requireConfiguration: {
          path: "dailyLeaderboards.enabled",
          invalidMessage: "Daily leaderboards are not available at this time.",
        },
      }),
    },
    getWeeklyXp: {
      summary: "get weekly xp leaderboard",
      description: "Get weekly xp leaderboard",
      method: "GET",
      path: "/xp/weekly",
      query: GetWeeklyXpLeaderboardQuerySchema.strict(),
      responses: {
        200: GetWeeklyXpLeaderboardResponseSchema,
      },
      metadata: meta({
        authenticationOptions: { isPublic: true },
        requireConfiguration: {
          path: "leaderboards.weeklyXp.enabled",
          invalidMessage:
            "Weekly XP leaderboards are not available at this time.",
        },
      }),
    },
    getWeeklyXpRank: {
      summary: "get weekly xp leaderboard rank",
      description:
        "Get the rank of the current user on the weekly xp leaderboard",
      method: "GET",
      path: "/xp/weekly/rank",
      responses: {
        200: GetWeeklyXpLeaderboardRankResponseSchema,
      },
      metadata: meta({
        requireConfiguration: {
          path: "leaderboards.weeklyXp.enabled",
          invalidMessage:
            "Weekly XP leaderboards are not available at this time.",
        },
      }),
    },
  },
  {
    pathPrefix: "/leaderboards",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: "leaderboards",
      rateLimit: "leaderboardsGet",
    }),
    commonResponses: CommonResponses,
  }
);
