import { z } from "zod";
import {
  CustomTextLimitModeSchema,
  CustomTextModeSchema,
  IdSchema,
  PercentageSchema,
  token,
  WpmSchema,
} from "./util";
import { Mode2Schema, ModeSchema } from "./shared";
import { DifficultySchema, FunboxSchema, LanguageSchema } from "./configs";

export const IncompleteTestSchema = z.object({
  acc: PercentageSchema,
  seconds: z.number().nonnegative(),
});
export type IncompleteTest = z.infer<typeof IncompleteTestSchema>;

export const ChartDataSchema = z
  .object({
    wpm: z.array(z.number().nonnegative()).max(122),
    raw: z.array(z.number().nonnegative()).max(122),
    err: z.array(z.number().nonnegative()).max(122),
  })
  .or(z.literal("toolong"));
export type ChartData = z.infer<typeof ChartDataSchema>;

export const KeyStatsSchema = z.object({
  average: z.number().nonnegative(),
  sd: z.number().nonnegative(),
});
export type KeyStats = z.infer<typeof KeyStatsSchema>;

export const CustomTextSchema = z.object({
  textLen: z.number().int().nonnegative(),
  mode: CustomTextModeSchema,
  pipeDelimiter: z.boolean(),
  limit: z.object({
    mode: CustomTextLimitModeSchema,
    value: z.number().nonnegative(),
  }),
});

const ResultBaseSchema = z.object({
  _id: IdSchema,
  wpm: WpmSchema,
  rawWpm: WpmSchema,
  charStats: z.tuple([
    z.number().int().nonnegative(),
    z.number().int().nonnegative(),
    z.number().int().nonnegative(),
    z.number().int().nonnegative(),
  ]),
  acc: PercentageSchema.min(50), //TODO test
  mode: ModeSchema,
  mode2: Mode2Schema,
  quoteLength: z.number().int().nonnegative().max(3).optional(),
  timestamp: z.number().int().nonnegative(),
  testDuration: z.number().min(1),
  consistency: PercentageSchema,
  keyConsistency: PercentageSchema,
  chartData: ChartDataSchema,
  uid: IdSchema,
});

//required on POST but optional in the database and might be removed to save space
const ResultOptionalPropertiesSchema = z.object({
  restartCount: z.number().int().nonnegative(),
  incompleteTestSeconds: z.number().nonnegative(),
  incompleteTests: z.array(IncompleteTestSchema),
  afkDuration: z.number().nonnegative(),
  tags: z.array(IdSchema),
  isPb: z.boolean(),
  bailedOut: z.boolean(),
  blindMode: z.boolean(),
  lazyMode: z.boolean(),
  funbox: FunboxSchema,
  language: LanguageSchema,
  difficulty: DifficultySchema,
  numbers: z.boolean(),
  punctuation: z.boolean(),
});

//created by the backend
const ResultGeneratedPropertiesSchema = z.object({
  keySpacingStats: KeyStatsSchema,
  keyDurationStats: KeyStatsSchema,
  name: z.string(),
  correctChars: z.number(), //legacy result
  incorrectChars: z.number(), //legacy result
});

const ResultPostOnlySchema = z.object({
  charTotal: z.number().int().nonnegative().optional(),
  challenge: token().optional(),
  customText: CustomTextSchema.optional(),
  hash: token().max(100),
  keyDuration: z.array(z.number().nonnegative()).or(z.literal("toolong")),
  keySpacing: z.array(z.number().nonnegative()).or(z.literal("toolong")),
  keyOverlap: z.number().nonnegative(),
  lastKeyToEnd: z.number().nonnegative(),
  startToFirstKey: z.number().nonnegative(),
  wpmConsistency: PercentageSchema,
  stopOnLetter: z.boolean(),
});

export const ResultSchema = z.union([
  ResultBaseSchema,
  ResultOptionalPropertiesSchema.partial(), //TODO test
  ResultGeneratedPropertiesSchema,
]);
export type Result = z.infer<typeof ResultSchema>;

export const ResultPostSchema = z.union([
  ResultBaseSchema,
  ResultOptionalPropertiesSchema,
  ResultPostOnlySchema,
]);
export type CompletedEvent = z.infer<typeof ResultPostSchema>;
