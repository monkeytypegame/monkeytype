import { z } from "zod";
import { IdSchema } from "./util";
import { LanguageSchema } from "./languages";

// Tags for quotes
export const QUOTE_TAGS = [
  "fiction",
  "poetry",
  "philosophy",
  "political",
  "inspirational",
  "wisdom",
  "mindset",
  "humorous",
] as const;
export type QuoteTag = (typeof QUOTE_TAGS)[number];

// Tagged Languages
export const TAGGED_LANGUAGES = ["english"] as const;
export type TaggedLanguage = (typeof TAGGED_LANGUAGES)[number];

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

  //Remove '.optional()' once all languages are tagged
  tags: z.array(z.enum(QUOTE_TAGS)).min(1).optional(),
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
    tags: z.array(z.enum(QUOTE_TAGS)).min(1).optional(),
  })
  .strict();
export type QuoteDataQuote = z.infer<typeof QuoteDataQuoteSchema>;

const QuoteDataBaseSchema = z
  .object({
    language: LanguageSchema,
    groups: z.array(z.tuple([z.number(), z.number()])).length(4),
    quotes: z.array(QuoteDataQuoteSchema),
  })
  .strict();

export const QuoteDataSchema = QuoteDataBaseSchema.superRefine((data, ctx) => {
  if ((TAGGED_LANGUAGES as readonly string[]).includes(data.language)) {
    data.quotes.forEach((quote, index) => {
      if (!quote.tags || quote.tags.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Quote at index ${index} must have at least one tag.`,
          path: ["quotes", index, "tags"],
        });
      }
    });
  }
});

export type QuoteData = z.infer<typeof QuoteDataSchema>;
