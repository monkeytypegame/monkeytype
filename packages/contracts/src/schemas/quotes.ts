import { z } from "zod";
import { IdSchema, LanguageSchema } from "./util";

//TODO copy from #5802
export const QuoteIdSchema = z
  .number()
  .int()
  .nonnegative()
  .or(z.string().regex(/^\d+$/).transform(Number));
export type QuoteId = z.infer<typeof QuoteIdSchema>;
export const QuoteRatingSchema = z.object({
  _id: IdSchema,
  language: LanguageSchema,
  quoteId: QuoteIdSchema,
  average: z.number().nonnegative(),
  ratings: z.number().int().nonnegative(),
  totalRating: z.number().nonnegative(),
});
export type QuoteRating = z.infer<typeof QuoteRatingSchema>;
