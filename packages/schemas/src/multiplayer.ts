import { z } from "zod";
import { IdSchema, PercentageSchema, WpmSchema, token } from "./util";
import { LanguageSchema } from "./languages";
import { DifficultySchema } from "./shared";
import { CharStatsSchema } from "./results";

export const RoomCodeSchema = token().length(6);
export type RoomCode = z.infer<typeof RoomCodeSchema>;

export const RaceConfigSchema = z.object({
  mode: z.enum(["words", "time"]),
  words: z.number().int().min(10).max(200),
  time: z.number().int().min(15).max(300),
  language: LanguageSchema,
  punctuation: z.boolean(),
  numbers: z.boolean(),
  difficulty: DifficultySchema,
});
export type RaceConfig = z.infer<typeof RaceConfigSchema>;

export const RoomStatusSchema = z.enum([
  "lobby",
  "countdown",
  "racing",
  "finished",
]);
export type RoomStatus = z.infer<typeof RoomStatusSchema>;

export const RacePlayerStatusSchema = z.enum(["connected", "disconnected"]);
export type RacePlayerStatus = z.infer<typeof RacePlayerStatusSchema>;

export const RaceFinalResultSchema = z.object({
  wpm: WpmSchema,
  rawWpm: WpmSchema,
  acc: PercentageSchema,
  consistency: PercentageSchema,
  charStats: CharStatsSchema,
  finishedAt: z.number().int().nonnegative(),
});
export type RaceFinalResult = z.infer<typeof RaceFinalResultSchema>;

export const RacePlayerSchema = z.object({
  uid: IdSchema,
  name: z.string(),
  isHost: z.boolean(),
  isReady: z.boolean(),
  status: RacePlayerStatusSchema,
  finalResult: RaceFinalResultSchema.nullable(),
});
export type RacePlayer = z.infer<typeof RacePlayerSchema>;

export const RaceRoomSchema = z.object({
  roomCode: RoomCodeSchema,
  hostUid: IdSchema,
  status: RoomStatusSchema,
  config: RaceConfigSchema,
  wordList: z.array(z.string()).nullable(),
  players: z.array(RacePlayerSchema),
  createdAt: z.number().int().nonnegative(),
  raceStartedAt: z.number().int().nonnegative().nullable(),
});
export type RaceRoom = z.infer<typeof RaceRoomSchema>;
