import { z } from "zod";
import {
  CustomTextLimitModeSchema,
  CustomTextModeSchema,
  IdSchema,
  PercentageSchema,
  token,
  WpmSchema,
  LanguageSchema,
} from "./util";
import { Mode, Mode2, Mode2Schema, ModeSchema } from "./shared";
import { DifficultySchema, FunboxSchema } from "./configs";

export const IncompleteTestSchema = z.object({
  acc: PercentageSchema,
  seconds: z.number().nonnegative(),
});
export type IncompleteTest = z.infer<typeof IncompleteTestSchema>;

export const ChartDataSchema = z.object({
  wpm: z.array(z.number().nonnegative()).max(122),
  raw: z.array(z.number().nonnegative()).max(122),
  err: z.array(z.number().nonnegative()).max(122),
});
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
export type CustomTextDataWithTextLen = z.infer<typeof CustomTextSchema>;

export const CharStatsSchema = z.tuple([
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
]);
export type CharStats = z.infer<typeof CharStatsSchema>;

const ResultBaseSchema = z.object({
  wpm: WpmSchema,
  rawWpm: WpmSchema,
  charStats: CharStatsSchema,
  acc: PercentageSchema.min(75), //TODO test
  mode: ModeSchema,
  mode2: Mode2Schema,
  quoteLength: z.number().int().nonnegative().max(3).optional(),
  timestamp: z.number().int().nonnegative(),
  testDuration: z.number().min(1),
  consistency: PercentageSchema,
  keyConsistency: PercentageSchema,
  chartData: ChartDataSchema.or(z.literal("toolong")),
  uid: IdSchema,
});

//required on POST but optional in the database and might be removed to save space
const ResultOmittableDefaultPropertiesSchema = z.object({
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
  ResultOmittableDefaultPropertiesSchema.partial() //missing on GET if the values are the default values
).extend({
  _id: IdSchema,
  keySpacingStats: KeyStatsSchema.optional(),
  keyDurationStats: KeyStatsSchema.optional(),
  name: z.string(),
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
  ResultOmittableDefaultPropertiesSchema //mandatory on POST
)
  .extend({
    charTotal: z.number().int().nonnegative(),
    challenge: token().max(100).optional(),
    customText: CustomTextSchema.optional(),
    hash: token().max(100),
    keyDuration: z.array(z.number().nonnegative()).or(z.literal("toolong")),
    keySpacing: z.array(z.number().nonnegative()).or(z.literal("toolong")),
    keyOverlap: z.number().nonnegative(),
    lastKeyToEnd: z.number().nonnegative(),
    startToFirstKey: z.number().nonnegative(),
    wpmConsistency: PercentageSchema,
    stopOnLetter: z.boolean(),
  })
  .strict();

export type CompletedEvent = z.infer<typeof CompletedEventSchema>;

export const XpBreakdownSchema = z.object({
  base: z.number().int().optional(),
  "100%": z.number().int().optional(),
  quote: z.number().int().optional(),
  corrected: z.number().int().optional(),
  punctuation: z.number().int().optional(),
  numbers: z.number().int().optional(),
  funbox: z.number().int().optional(),
  streak: z.number().int().optional(),
  incomplete: z.number().int().optional(),
  daily: z.number().int().optional(),
  accPenalty: z.number().int().optional(),
  configMultiplier: z.number().int().optional(),
});
export type XpBreakdown = z.infer<typeof XpBreakdownSchema>;

export const PostResultResponseSchema = z.object({
  insertedId: IdSchema,
  isPb: z.boolean(),
  tagPbs: z.array(IdSchema),
  dailyLeaderboardRank: z.number().int().nonnegative().optional(),
  weeklyXpLeaderboardRank: z.number().int().nonnegative().optional(),
  xp: z.number().int().nonnegative(),
  dailyXpBonus: z.boolean(),
  xpBreakdown: XpBreakdownSchema,
  streak: z.number().int().nonnegative(),
});
export type PostResultResponse = z.infer<typeof PostResultResponseSchema>;
