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

export const DailyLeaderboardRankSchema = LeaderboardEntrySchema;
export type DailyLeaderboardRank = z.infer<typeof DailyLeaderboardRankSchema>;

export const XpLeaderboardEntrySchema = z.object({
  uid: z.string(),
  name: z.string(),
  discordId: z.string().optional(),
  discordAvatar: z.string().optional(),
  badgeId: z.number().int().optional(),
  lastActivityTimestamp: z.number().int().nonnegative(),
  timeTypedSeconds: z.number().nonnegative(),
  rank: z.number().nonnegative().int(),
  totalXp: z.number().nonnegative().int(),
  isPremium: z.boolean().optional(),
});
export type XpLeaderboardEntry = z.infer<typeof XpLeaderboardEntrySchema>;
