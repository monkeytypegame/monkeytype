import { z } from "zod";
import { IdSchema } from "./util";
import { ModeSchema } from "./shared";

export const ResultFiltersSchema = z.object({
  _id: IdSchema,
  name: z.string(),
  pb: z.object({
    no: z.boolean(),
    yes: z.boolean(),
  }),
  difficulty: z.object({
    normal: z.boolean(),
    expert: z.boolean(),
    master: z.boolean(),
  }),
  mode: z.record(ModeSchema, z.boolean()),
  words: z.object({
    "10": z.boolean(),
    "25": z.boolean(),
    "50": z.boolean(),
    "100": z.boolean(),
    custom: z.boolean(),
  }),
  time: z.object({
    "15": z.boolean(),
    "30": z.boolean(),
    "60": z.boolean(),
    "120": z.boolean(),
    custom: z.boolean(),
  }),
  quoteLength: z.object({
    short: z.boolean(),
    medium: z.boolean(),
    long: z.boolean(),
    thicc: z.boolean(),
  }),
  punctuation: z.object({
    on: z.boolean(),
    off: z.boolean(),
  }),
  numbers: z.object({
    on: z.boolean(),
    off: z.boolean(),
  }),
  date: z.object({
    last_day: z.boolean(),
    last_week: z.boolean(),
    last_month: z.boolean(),
    last_3months: z.boolean(),
    all: z.boolean(),
  }),
  tags: z.record(z.boolean()),
  language: z.record(z.boolean()),
  funbox: z.record(z.boolean()),
});
export type ResultFilters = z.infer<typeof ResultFiltersSchema>;

export type ResultFiltersGroup = keyof ResultFilters;

export type ResultFiltersGroupItem<T extends ResultFiltersGroup> =
  keyof ResultFilters[T];
