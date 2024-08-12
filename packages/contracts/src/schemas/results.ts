import { z } from "zod";
import {
  CustomTextLimitModeSchema,
  CustomTextModeSchema,
  IdSchema,
  PercentageSchema,
  token,
  WpmSchema,
} from "./util";
import { Mode, Mode2, Mode2Schema, ModeSchema } from "./shared";
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
  wpm: WpmSchema,
  rawWpm: WpmSchema,
  charStats: z.tuple([
    z.number().int().nonnegative(),
    z.number().int().nonnegative(),
    z.number().int().nonnegative(),
    z.number().int().nonnegative(),
  ]),
  acc: PercentageSchema.min(75), //TODO test
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
  bailedOut: z.boolean(),
  blindMode: z.boolean(),
  lazyMode: z.boolean(),
  funbox: FunboxSchema,
  language: LanguageSchema,
  difficulty: DifficultySchema,
  numbers: z.boolean(),
  punctuation: z.boolean(),
});

export const ResultSchema = ResultBaseSchema.merge(
  ResultOptionalPropertiesSchema.partial()
).extend({
  _id: IdSchema,
  keySpacingStats: KeyStatsSchema.optional(),
  keyDurationStats: KeyStatsSchema.optional(),
  name: z.string(),
  correctChars: z.number().optional(), //legacy result
  incorrectChars: z.number().optional(), //legacy result
  isPb: z.boolean().optional(), //true or undefined
});

export type Result<M extends Mode> = Omit<
  z.infer<typeof ResultSchema>,
  "mode" | "mode2"
> & {
  mode: M;
  mode2: Mode2<M>;
};

export const CompletedEventSchema = ResultBaseSchema.merge(
  ResultOptionalPropertiesSchema
)
  .extend({
    charTotal: z.number().int().nonnegative(), //was optional in result-schema but mandatory on server
    challenge: token().max(100).optional(),
    customText: CustomTextSchema.optional(),
    hash: token().max(100),
    keyDuration: z.array(z.number().nonnegative()).or(z.literal("toolong")), //was optional in result-schema but mandatory on server
    keySpacing: z.array(z.number().nonnegative()).or(z.literal("toolong")), //was optional in result-schema but mandatory on server
    keyOverlap: z.number().nonnegative(), //was optional in result-schema but mandatory on server
    lastKeyToEnd: z.number().nonnegative(), //was optional in result-schema but mandatory on server
    startToFirstKey: z.number().nonnegative(), //was optional in result-schema but mandatory on server
    wpmConsistency: PercentageSchema,
    stopOnLetter: z.boolean(),
  })
  .strict();

export type CompletedEvent<M extends Mode> = Omit<
  z.infer<typeof CompletedEventSchema>,
  "mode" | "mode2"
> & {
  mode: M;
  mode2: Mode2<M>;
};
