import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  CommonResponses,
  EndpointMetadata,
  MonkeyResponseSchema,
  responseWithData,
  responseWithNullableData,
} from "./schemas/api";
import {
  ApproveQuoteSchema,
  QuoteIdSchema,
  QuoteRatingSchema,
  QuoteReportReasonSchema,
  QuoteSchema,
} from "./schemas/quotes";
import { IdSchema, LanguageSchema, NullableStringSchema } from "./schemas/util";

export const GetQuotesResponseSchema = responseWithData(z.array(QuoteSchema));
export type GetQuotesResponse = z.infer<typeof GetQuotesResponseSchema>;

export const IsSubmissionEnabledResponseSchema = responseWithData(
  z.object({
    isEnabled: z.boolean(),
  })
);
export type IsSubmissionEnabledResponse = z.infer<
  typeof IsSubmissionEnabledResponseSchema
>;

export const AddQuoteRequestSchema = z.object({
  text: z.string().min(60),
  source: z.string(),
  language: LanguageSchema,
  captcha: z.string(), //we don't generate the captcha so there should be no validation
});
export type AddQuoteRequest = z.infer<typeof AddQuoteRequestSchema>;

export const ApproveQuoteRequestSchema = z.object({
  quoteId: IdSchema,
  editText: NullableStringSchema,
  editSource: NullableStringSchema,
});
export type ApproveQuoteRequest = z.infer<typeof ApproveQuoteRequestSchema>;

export const ApproveQuoteResponseSchema = responseWithData(ApproveQuoteSchema);
export type ApproveQuoteResponse = z.infer<typeof ApproveQuoteResponseSchema>;

export const RejectQuoteRequestSchema = z.object({
  quoteId: IdSchema,
});
export type RejectQuoteRequest = z.infer<typeof RejectQuoteRequestSchema>;

export const GetQuoteRatingQuerySchema = z.object({
  quoteId: QuoteIdSchema,
  language: LanguageSchema,
});
export type GetQuoteRatingQuery = z.infer<typeof GetQuoteRatingQuerySchema>;

export const GetQuoteRatingResponseSchema =
  responseWithNullableData(QuoteRatingSchema);
export type GetQuoteRatingResponse = z.infer<
  typeof GetQuoteRatingResponseSchema
>;

export const AddQuoteRatingRequestSchema = z.object({
  quoteId: QuoteIdSchema,
  language: LanguageSchema,
  rating: z.number().int().min(1).max(5),
});
export type AddQuoteRatingRequest = z.infer<typeof AddQuoteRatingRequestSchema>;

export const ReportQuoteRequestSchema = z.object({
  quoteId: QuoteIdSchema,
  quoteLanguage: LanguageSchema,
  reason: QuoteReportReasonSchema,
  comment: z
    .string()
    .regex(/^([.]|[^/<>])+$/)
    .max(250)
    .optional()
    .or(z.string().length(0)),
  captcha: z.string(), //we don't generate the captcha so there should be no validation
});
export type ReportQuoteRequest = z.infer<typeof ReportQuoteRequestSchema>;

const c = initContract();
export const quotesContract = c.router(
  {
    get: {
      summary: "get quote submissions",
      description: "Get list of quote submissions",
      method: "GET",
      path: "",
      responses: {
        200: GetQuotesResponseSchema,
      },
    },
    isSubmissionEnabled: {
      summary: "is submission enabled",
      description: "Check if submissions are enabled.",
      method: "GET",
      path: "/isSubmissionEnabled",
      responses: {
        200: IsSubmissionEnabledResponseSchema,
      },
      metadata: {
        authenticationOptions: { isPublic: true },
      } as EndpointMetadata,
    },
    add: {
      summary: "submit quote",
      description: "Add a quote submission",
      method: "POST",
      path: "",
      body: AddQuoteRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    approveSubmission: {
      summary: "submit quote",
      description: "Add a quote submission",
      method: "POST",
      path: "/approve",
      body: ApproveQuoteRequestSchema.strict(),
      responses: {
        200: ApproveQuoteResponseSchema,
      },
    },
    rejectSubmission: {
      summary: "reject quote",
      description: "Reject a quote submission",
      method: "POST",
      path: "/reject",
      body: RejectQuoteRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    getRating: {
      summary: "get rating",
      description: "Get quote rating",
      method: "GET",
      path: "/rating",
      query: GetQuoteRatingQuerySchema.strict(),
      responses: {
        200: GetQuoteRatingResponseSchema,
      },
    },
    addRating: {
      summary: "add rating",
      description: "Add a quote rating",
      method: "POST",
      path: "/rating",
      body: AddQuoteRatingRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    report: {
      summary: "report quote",
      description: "Report a quote",
      method: "POST",
      path: "/report",
      body: ReportQuoteRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
  },
  {
    pathPrefix: "/quotes",
    strictStatusCodes: true,
    metadata: {
      openApiTags: "quotes",
    } as EndpointMetadata,
    commonResponses: CommonResponses,
  }
);
