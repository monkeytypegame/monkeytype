import { z } from "zod";
import { IdSchema, LanguageSchema } from "./util";

export const NewQuoteSchema = z.object({
  _id: IdSchema,
  text: z.string(),
  source: z.string(),
  language: LanguageSchema,
  submittedBy: z.string(),
  timestamp: z.number().int().nonnegative(),
  approved: z.boolean(),
});
export type NewQuote = z.infer<typeof NewQuoteSchema>;

export const QuoteIdSchema = z
  .number()
  .int()
  .nonnegative()
  .or(z.string().regex(/^\d+$/).transform(Number));
export type QuoteId = z.infer<typeof QuoteIdSchema>;

export const QuoteSchema = z.object({
  id: QuoteIdSchema.optional(),
  text: z.string(),
  source: z.string(),
  length: z.number().int().positive(),
  approvedBy: z.string(), //TODO: is this a name or a uid?
});
export type Quote = z.infer<typeof QuoteSchema>;

export const QuoteRatingSchema = z.object({
  _id: IdSchema, //TODO omit?
  language: LanguageSchema,
  quoteId: QuoteIdSchema,
  average: z.number().nonnegative(),
  ratings: z.number().int().nonnegative(),
  totalRating: z.number().nonnegative(),
});
export type QuoteRating = z.infer<typeof QuoteRatingSchema>;
