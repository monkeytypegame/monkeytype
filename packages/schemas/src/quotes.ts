import { z } from "zod";
import { IdSchema } from "./util";
import { LanguageSchema } from "./languages";

export const QuoteIdSchema = z
  .number()
  .int()
  .nonnegative()
  .or(z.string().regex(/^\d+$/).transform(Number));
export type QuoteId = z.infer<typeof QuoteIdSchema>;

export const ApproveQuoteSchema = z.object({
  id: QuoteIdSchema,
  text: z.string(),
  source: z.string(),
  length: z.number().int().positive(),
  approvedBy: z.string().describe("The approvers name"),
});
export type ApproveQuote = z.infer<typeof ApproveQuoteSchema>;

export const QuoteSchema = z.object({
  _id: IdSchema,
  text: z.string(),
  source: z.string(),
  language: LanguageSchema,
  submittedBy: IdSchema.describe("uid of the submitter"),
  timestamp: z.number().int().nonnegative(),
  approved: z.boolean(),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const QuoteRatingSchema = z.object({
  _id: IdSchema,
  language: LanguageSchema,
  quoteId: QuoteIdSchema,
  average: z.number().nonnegative(),
  ratings: z.number().int().nonnegative(),
  totalRating: z.number().nonnegative(),
});
export type QuoteRating = z.infer<typeof QuoteRatingSchema>;

export const QuoteReportReasonSchema = z.enum([
  "Grammatical error",
  "Duplicate quote",
  "Inappropriate content",
  "Low quality content",
  "Incorrect source",
]);
export type QuoteReportReason = z.infer<typeof QuoteReportReasonSchema>;

export const QuoteDataQuoteSchema = z
  .object({
    id: z.number(),
    text: z.string(),
    britishText: z.string().optional(),
    source: z.string(),
    length: z.number(),
    approvedBy: z.string().optional(),
  })
  .strict();
export type QuoteDataQuote = z.infer<typeof QuoteDataQuoteSchema>;

export const QuoteDataSchema = z
  .object({
    language: LanguageSchema,
    groups: z.array(z.tuple([z.number(), z.number()])).length(4),
    quotes: z.array(QuoteDataQuoteSchema),
  })
  .strict();

export type QuoteData = z.infer<typeof QuoteDataSchema>;
