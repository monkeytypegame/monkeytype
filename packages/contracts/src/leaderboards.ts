import { z } from "zod";
import {
  CommonResponses,
  meta,
  responseWithData,
  responseWithNullableData,
} from "./schemas/api";
import {
  LeaderboardEntrySchema,
  XpLeaderboardEntrySchema,
} from "./schemas/leaderboards";
import { Mode2Schema, ModeSchema } from "./schemas/shared";
import { initContract } from "@ts-rest/core";
import { LanguageSchema } from "./schemas/languages";

const LanguageAndModeQuerySchema = z.object({
  language: LanguageSchema,
  mode: ModeSchema,
  mode2: Mode2Schema,
});

const PaginationQuerySchema = z.object({
  page: z.number().int().safe().nonnegative().default(0),
  pageSize: z.number().int().safe().positive().min(10).max(200).default(50),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

const LeaderboardResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
});

//--------------------------------------------------------------------------

export const GetLeaderboardQuerySchema = LanguageAndModeQuerySchema.merge(
  PaginationQuerySchema
);
export type GetLeaderboardQuery = z.infer<typeof GetLeaderboardQuerySchema>;

export const GetLeaderboardResponseSchema = responseWithData(
  LeaderboardResponseSchema.extend({
    entries: z.array(LeaderboardEntrySchema),
  })
);
export type GetLeaderboardResponse = z.infer<
  typeof GetLeaderboardResponseSchema
>;

//--------------------------------------------------------------------------

export const GetLeaderboardRankQuerySchema = LanguageAndModeQuerySchema;
export type GetLeaderboardRankQuery = z.infer<
  typeof GetLeaderboardRankQuerySchema
>;
export const GetLeaderboardRankResponseSchema = responseWithNullableData(
  LeaderboardEntrySchema
);
export type GetLeaderboardRankResponse = z.infer<
  typeof GetLeaderboardRankResponseSchema
>;

//--------------------------------------------------------------------------

export const DailyLeaderboardQuerySchema = LanguageAndModeQuerySchema.extend({
  daysBefore: z.literal(1).optional(),
});
export type DailyLeaderboardQuery = z.infer<typeof DailyLeaderboardQuerySchema>;

export const GetDailyLeaderboardQuerySchema = DailyLeaderboardQuerySchema.merge(
  PaginationQuerySchema
);
export type GetDailyLeaderboardQuery = z.infer<
  typeof GetDailyLeaderboardQuerySchema
>;
export const GetDailyLeaderboardResponseSchema = responseWithData(
  LeaderboardResponseSchema.extend({
    entries: z.array(LeaderboardEntrySchema),
    minWpm: z.number().nonnegative(),
  })
);
export type GetDailyLeaderboardResponse = z.infer<
  typeof GetDailyLeaderboardResponseSchema
>;

//--------------------------------------------------------------------------

export const GetDailyLeaderboardRankQuerySchema = DailyLeaderboardQuerySchema;

export type GetDailyLeaderboardRankQuery = z.infer<
  typeof GetDailyLeaderboardRankQuerySchema
>;
export const GetLeaderboardDailyRankResponseSchema = responseWithNullableData(
  LeaderboardEntrySchema
);
export type GetLeaderboardDailyRankResponse = z.infer<
  typeof GetLeaderboardDailyRankResponseSchema
>;

//--------------------------------------------------------------------------

const WeeklyXpLeaderboardQuerySchema = z.object({
  weeksBefore: z.literal(1).optional(),
});

export const GetWeeklyXpLeaderboardQuerySchema =
  WeeklyXpLeaderboardQuerySchema.merge(PaginationQuerySchema);

export type GetWeeklyXpLeaderboardQuery = z.infer<
  typeof GetWeeklyXpLeaderboardQuerySchema
>;
export const GetWeeklyXpLeaderboardResponseSchema = responseWithData(
  LeaderboardResponseSchema.extend({
    entries: z.array(XpLeaderboardEntrySchema),
  })
);
export type GetWeeklyXpLeaderboardResponse = z.infer<
  typeof GetWeeklyXpLeaderboardResponseSchema
>;

//--------------------------------------------------------------------------

export const GetWeeklyXpLeaderboardRankQuerySchema =
  WeeklyXpLeaderboardQuerySchema;
export type GetWeeklyXpLeaderboardRankQuery = z.infer<
  typeof GetWeeklyXpLeaderboardRankQuerySchema
>;

export const GetWeeklyXpLeaderboardRankResponseSchema =
  responseWithNullableData(XpLeaderboardEntrySchema);
export type GetWeeklyXpLeaderboardRankResponse = z.infer<
  typeof GetWeeklyXpLeaderboardRankResponseSchema
>;

//--------------------------------------------------------------------------

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
      query: GetLeaderboardRankQuerySchema.strict(),
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
        200: GetDailyLeaderboardResponseSchema,
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
      query: GetWeeklyXpLeaderboardRankQuerySchema.strict(),
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
