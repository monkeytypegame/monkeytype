import { literal, z } from "zod";
import { StringNumberSchema } from "./util";

//used by config and shared
export const DifficultySchema = z.enum(["normal", "expert", "master"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

//used by user and config
export const PersonalBestSchema = z.object({
  acc: z.number().nonnegative().max(100),
  consistency: z.number().nonnegative().max(100),
  difficulty: DifficultySchema,
  lazyMode: z.boolean().optional(),
  language: z
    .string()
    .max(100)
    .regex(/[\w+]+/),
  punctuation: z.boolean().optional(),
  numbers: z.boolean().optional(),
  raw: z.number().nonnegative(),
  wpm: z.number().nonnegative(),
  timestamp: z.number().nonnegative(),
});
export type PersonalBest = z.infer<typeof PersonalBestSchema>;

//used by user and config
export const PersonalBestsSchema = z.object({
  time: z.record(
    StringNumberSchema.describe("Number of seconds as string"),
    z.array(PersonalBestSchema)
  ),
  words: z.record(
    StringNumberSchema.describe("Number of words as string"),
    z.array(PersonalBestSchema)
  ),
  quote: z.record(StringNumberSchema, z.array(PersonalBestSchema)),
  custom: z.record(z.literal("custom"), z.array(PersonalBestSchema)),
  zen: z.record(z.literal("zen"), z.array(PersonalBestSchema)),
});
export type PersonalBests = z.infer<typeof PersonalBestsSchema>;

//used by user, config, public
export const ModeSchema = PersonalBestsSchema.keyof();
export type Mode = z.infer<typeof ModeSchema>;

export const Mode2Schema = z.union(
  [StringNumberSchema, literal("zen"), literal("custom")],
  {
    errorMap: () => ({
      message: 'Needs to be either a number, "zen" or "custom".',
    }),
  }
);

export type Mode2<M extends Mode> = M extends M
  ? keyof PersonalBests[M]
  : never;
export type Mode2Custom<M extends Mode> = Mode2<M> | "custom";
