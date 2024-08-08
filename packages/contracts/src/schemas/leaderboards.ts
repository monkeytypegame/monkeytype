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

export const LeaderboardRankSchema = z.object({
  count: z.number().int().nonnegative(),
  rank: z.number().int().nonnegative().optional(),
  entry: LeaderboardEntrySchema.optional(),
});
export type LeaderboardRank = z.infer<typeof LeaderboardRankSchema>;

export const DailyLeaderboardRankSchema = LeaderboardRankSchema.extend({
  minWpm: z.number().nonnegative(),
});
export type DailyLeaderboardRank = z.infer<typeof DailyLeaderboardRankSchema>;
