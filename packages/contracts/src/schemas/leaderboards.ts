import { z } from "zod";

export const LeaderboardEntrySchema = z.object({
  wpm: z.number().nonnegative(),
  acc: z.number().nonnegative().min(0).max(100),
  timestamp: z.number().int().nonnegative(),
  raw: z.number().nonnegative(),
  consistency: z.number().nonnegative().optional(),
  uid: z.string(),
  name: z.string(),
  discordId: z.string().optional(),
  discordAvatar: z.string().optional(),
  rank: z.number().nonnegative().int(),
  badgeId: z.number().int().optional(),
  isPremium: z.boolean().optional(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const RedisDailyLeaderboardEntrySchema = LeaderboardEntrySchema.omit({
  rank: true,
});
export type RedisDailyLeaderboardEntry = z.infer<
  typeof RedisDailyLeaderboardEntrySchema
>;

export const DailyLeaderboardRankSchema = LeaderboardEntrySchema;
export type DailyLeaderboardRank = z.infer<typeof DailyLeaderboardRankSchema>;

export const RedisXpLeaderboardEntrySchema = z.object({
  uid: z.string(),
  name: z.string(),
  lastActivityTimestamp: z.number().int().nonnegative(),
  timeTypedSeconds: z.number().nonnegative(),
  // optionals
  // discordId: z.string().optional(),
  discordId: z //todo remove once weekly leaderboards reset twice and remove null values
    .string()
    .optional()
    .or(z.null().transform((_val) => undefined)),
  discordAvatar: z.string().optional(),
  badgeId: z.number().int().optional(),
  isPremium: z.boolean().optional(),
});
export type RedisXpLeaderboardEntry = z.infer<
  typeof RedisXpLeaderboardEntrySchema
>;

export const RedisXpLeaderboardScoreSchema = z.number().int().nonnegative();
export type RedisXpLeaderboardScore = z.infer<
  typeof RedisXpLeaderboardScoreSchema
>;

export const XpLeaderboardEntrySchema = RedisXpLeaderboardEntrySchema.extend({
  //based on another redis collection
  totalXp: RedisXpLeaderboardScoreSchema,
  // dynamically added when generating response on the backend
  rank: z.number().nonnegative().int(),
});
export type XpLeaderboardEntry = z.infer<typeof XpLeaderboardEntrySchema>;
