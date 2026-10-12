import { it, expect, describe } from "vitest";
import {
  QuoteIdSchema,
  ApproveQuoteSchema,
  QuoteSchema,
  QuoteRatingSchema,
  QuoteReportReasonSchema,
  QuoteDataQuoteSchema,
  QuoteDataSchema,
} from "../src/quotes";

describe("quotes schemas", () => {
  describe("QuoteIdSchema", () => {
    it.each([
      {
        description: "valid numeric quote id",
        input: 123,
      },
      {
        description: "valid numeric string quote id",
        input: "456",
      },
      {
        description: "valid zero quote id",
        input: 0,
      },
      {
        description: "valid numeric string zero quote id",
        input: "0",
      },
      {
        description: "negative number",
        input: -1,
        expectedError: "Number must be greater than or equal to 0",
      },
      {
        description: "non-numeric string",
        input: "abc",
        expectedError: "Invalid",
      },
      {
        description: "float number",
        input: 1.5,
        expectedError: "Expected integer, received float",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(QuoteIdSchema).toReject(input, expectedError);
      } else {
        expect(QuoteIdSchema).toValidate(input);
      }
    });
  });

  describe("ApproveQuoteSchema", () => {
    it.each([
      {
        description: "valid approve quote",
        input: {
          id: 123,
          text: "Test quote text",
          source: "Test source",
          length: 18,
          approvedBy: "John Doe",
        },
      },
      {
        description: "missing id",
        input: {
          text: "Test quote text",
          source: "Test source",
          length: 18,
          approvedBy: "John Doe",
        },
        expectedError: "Invalid input",
      },
      {
        description: "missing text",
        input: {
          id: 123,
          source: "Test source",
          length: 18,
          approvedBy: "John Doe",
        },
        expectedError: "Required",
      },
      {
        description: "missing source",
        input: {
          id: 123,
          text: "Test quote text",
          length: 18,
          approvedBy: "John Doe",
        },
        expectedError: "Required",
      },
      {
        description: "missing length",
        input: {
          id: 123,
          text: "Test quote text",
          source: "Test source",
          approvedBy: "John Doe",
        },
        expectedError: "Required",
      },
      {
        description: "missing approvedBy",
        input: {
          id: 123,
          text: "Test quote text",
          source: "Test source",
          length: 18,
        },
        expectedError: "Required",
      },
      {
        description: "length is zero",
        input: {
          id: 123,
          text: "Test quote text",
          source: "Test source",
          length: 0,
          approvedBy: "John Doe",
        },
        expectedError: "Number must be greater than 0",
      },
      {
        description: "length is negative",
        input: {
          id: 123,
          text: "Test quote text",
          source: "Test source",
          length: -1,
          approvedBy: "John Doe",
        },
        expectedError: "Number must be greater than 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ApproveQuoteSchema).toReject(input, expectedError);
      } else {
        expect(ApproveQuoteSchema).toValidate(input);
      }
    });
  });

  describe("QuoteSchema", () => {
    it.each([
      {
        description: "valid quote",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          text: "Test quote text",
          source: "Test source",
          language: "english",
          submittedBy: "60d5f3d9e4b0a71f8d9f1234",
          timestamp: 1625097993000,
          approved: true,
        },
      },
      {
        description: "approved is false",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          text: "Test quote text",
          source: "Test source",
          language: "english",
          submittedBy: "60d5f3d9e4b0a71f8d9f1234",
          timestamp: 1625097993000,
          approved: false,
        },
      },
      {
        description: "missing _id",
        input: {
          text: "Test quote text",
          source: "Test source",
          language: "english",
          submittedBy: "60d5f3d9e4b0a71f8d9f1234",
          timestamp: 1625097993000,
          approved: true,
        },
        expectedError: "Required",
      },
      {
        description: "missing text",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          source: "Test source",
          language: "english",
          submittedBy: "60d5f3d9e4b0a71f8d9f1234",
          timestamp: 1625097993000,
          approved: true,
        },
        expectedError: "Required",
      },
      {
        description: "missing source",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          text: "Test quote text",
          language: "english",
          submittedBy: "60d5f3d9e4b0a71f8d9f1234",
          timestamp: 1625097993000,
          approved: true,
        },
        expectedError: "Required",
      },
      {
        description: "missing language",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          text: "Test quote text",
          source: "Test source",
          submittedBy: "60d5f3d9e4b0a71f8d9f1234",
          timestamp: 1625097993000,
          approved: true,
        },
        expectedError: "Required",
      },
      {
        description: "missing submittedBy",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          text: "Test quote text",
          source: "Test source",
          language: "english",
          timestamp: 1625097993000,
          approved: true,
        },
        expectedError: "Required",
      },
      {
        description: "missing timestamp",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          text: "Test quote text",
          source: "Test source",
          language: "english",
          submittedBy: "60d5f3d9e4b0a71f8d9f1234",
          approved: true,
        },
        expectedError: "Required",
      },
      {
        description: "missing approved",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          text: "Test quote text",
          source: "Test source",
          language: "english",
          submittedBy: "60d5f3d9e4b0a71f8d9f1234",
          timestamp: 1625097993000,
        },
        expectedError: "Required",
      },
      {
        description: "timestamp is negative",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          text: "Test quote text",
          source: "Test source",
          language: "english",
          submittedBy: "60d5f3d9e4b0a71f8d9f1234",
          timestamp: -1,
          approved: true,
        },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(QuoteSchema).toReject(input, expectedError);
      } else {
        expect(QuoteSchema).toValidate(input);
      }
    });
  });

  describe("QuoteRatingSchema", () => {
    it.each([
      {
        description: "valid quote rating",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          language: "english",
          quoteId: 123,
          average: 4.5,
          ratings: 10,
          totalRating: 45,
        },
      },
      {
        description: "average is zero",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          language: "english",
          quoteId: 123,
          average: 0,
          ratings: 0,
          totalRating: 0,
        },
      },
      {
        description: "missing _id",
        input: {
          language: "english",
          quoteId: 123,
          average: 4.5,
          ratings: 10,
          totalRating: 45,
        },
        expectedError: "Required",
      },
      {
        description: "missing language",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          quoteId: 123,
          average: 4.5,
          ratings: 10,
          totalRating: 45,
        },
        expectedError: "Required",
      },
      {
        description: "missing quoteId",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          language: "english",
          average: 4.5,
          ratings: 10,
          totalRating: 45,
        },
        expectedError: "Invalid input",
      },
      {
        description: "missing average",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          language: "english",
          quoteId: 123,
          ratings: 10,
          totalRating: 45,
        },
        expectedError: "Required",
      },
      {
        description: "missing ratings",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          language: "english",
          quoteId: 123,
          average: 4.5,
          totalRating: 45,
        },
        expectedError: "Required",
      },
      {
        description: "missing totalRating",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          language: "english",
          quoteId: 123,
          average: 4.5,
          ratings: 10,
        },
        expectedError: "Required",
      },
      {
        description: "average is negative",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          language: "english",
          quoteId: 123,
          average: -0.5,
          ratings: 10,
          totalRating: 45,
        },
        expectedError: "Number must be greater than or equal to 0",
      },
      {
        description: "ratings is negative",
        input: {
          _id: "60d5f3d9e4b0a71f8d9f1234",
          language: "english",
          quoteId: 123,
          average: 4.5,
          ratings: -1,
          totalRating: 45,
        },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(QuoteRatingSchema).toReject(input, expectedError);
      } else {
        expect(QuoteRatingSchema).toValidate(input);
      }
    });
  });

  describe("QuoteReportReasonSchema", () => {
    it.each([
      {
        description: "valid reason - grammatical error",
        input: "Grammatical error",
      },
      {
        description: "valid reason - duplicate quote",
        input: "Duplicate quote",
      },
      {
        description: "valid reason - inappropriate content",
        input: "Inappropriate content",
      },
      {
        description: "valid reason - low quality content",
        input: "Low quality content",
      },
      {
        description: "valid reason - incorrect source",
        input: "Incorrect source",
      },
      {
        description: "invalid reason",
        input: "Invalid reason",
        expectedError:
          "Invalid enum value. Expected 'Grammatical error' | 'Duplicate quote' | 'Inappropriate content' | 'Low quality content' | 'Incorrect source', received 'Invalid reason'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(QuoteReportReasonSchema).toReject(input, expectedError);
      } else {
        expect(QuoteReportReasonSchema).toValidate(input);
      }
    });
  });

  describe("QuoteDataQuoteSchema", () => {
    it.each([
      {
        description: "valid quote data quote with britishText",
        input: {
          id: 123,
          text: "Test quote text",
          britishText: "British spelling",
          source: "Test source",
          length: 18,
          approvedBy: "John Doe",
        },
      },
      {
        description:
          "valid quote data quote without britishText and approvedBy",
        input: {
          id: 123,
          text: "Test quote text",
          source: "Test source",
          length: 18,
        },
      },
      {
        description: "missing id",
        input: {
          text: "Test quote text",
          source: "Test source",
          length: 18,
        },
        expectedError: "Required",
      },
      {
        description: "missing text",
        input: {
          id: 123,
          source: "Test source",
          length: 18,
        },
        expectedError: "Required",
      },
      {
        description: "missing source",
        input: {
          id: 123,
          text: "Test quote text",
          length: 18,
        },
        expectedError: "Required",
      },
      {
        description: "missing length",
        input: {
          id: 123,
          text: "Test quote text",
          source: "Test source",
        },
        expectedError: "Required",
      },
      {
        description: "extra property not allowed",
        input: {
          id: 123,
          text: "Test quote text",
          source: "Test source",
          length: 18,
          extraProp: "value",
        },
        expectedError: "Unrecognized key(s) in object: 'extraProp'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(QuoteDataQuoteSchema).toReject(input, expectedError);
      } else {
        expect(QuoteDataQuoteSchema).toValidate(input);
      }
    });
  });

  describe("QuoteDataSchema", () => {
    it.each([
      {
        description: "valid quote data",
        input: {
          language: "english",
          groups: [
            [0, 10],
            [10, 20],
            [20, 30],
            [30, 40],
          ],
          quotes: [
            {
              id: 1,
              text: "Quote 1",
              source: "Source 1",
              length: 8,
            },
            {
              id: 2,
              text: "Quote 2",
              britishText: "British quote 2",
              source: "Source 2",
              length: 9,
              approvedBy: "John Doe",
            },
          ],
        },
      },
      {
        description: "missing language",
        input: {
          groups: [
            [0, 10],
            [10, 20],
            [20, 30],
            [30, 40],
          ],
          quotes: [
            {
              id: 1,
              text: "Quote 1",
              source: "Source 1",
              length: 8,
            },
          ],
        },
        expectedError: "Required",
      },
      {
        description: "missing groups",
        input: {
          language: "english",
          quotes: [
            {
              id: 1,
              text: "Quote 1",
              source: "Source 1",
              length: 8,
            },
          ],
        },
        expectedError: "Required",
      },
      {
        description: "missing quotes",
        input: {
          language: "english",
          groups: [
            [0, 10],
            [10, 20],
            [20, 30],
            [30, 40],
          ],
        },
        expectedError: "Required",
      },
      {
        description: "groups length is not 4",
        input: {
          language: "english",
          groups: [
            [0, 10],
            [10, 20],
          ],
          quotes: [
            {
              id: 1,
              text: "Quote 1",
              source: "Source 1",
              length: 8,
            },
          ],
        },
        expectedError: "Array must contain exactly 4 element(s)",
      },
      {
        description: "groups item is not tuple of length 2",
        input: {
          language: "english",
          groups: [
            [0, 10, 20],
            [10, 20],
            [20, 30],
            [30, 40],
          ],
          quotes: [
            {
              id: 1,
              text: "Quote 1",
              source: "Source 1",
              length: 8,
            },
          ],
        },
        expectedError: "Array must contain at most 2 element(s)",
      },
      {
        description: "quotes item has extra property not allowed",
        input: {
          language: "english",
          groups: [
            [0, 10],
            [10, 20],
            [20, 30],
            [30, 40],
          ],
          quotes: [
            {
              id: 1,
              text: "Quote 1",
              source: "Source 1",
              length: 8,
              extraProp: "value",
            },
          ],
        },
        expectedError: "Unrecognized key(s) in object: 'extraProp'",
      },
      {
        description: "extra property not allowed at root level",
        input: {
          language: "english",
          groups: [
            [0, 10],
            [10, 20],
            [20, 30],
            [30, 40],
          ],
          quotes: [
            {
              id: 1,
              text: "Quote 1",
              source: "Source 1",
              length: 8,
            },
          ],
        },
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(QuoteDataSchema).toReject(input, expectedError);
      } else {
        expect(QuoteDataSchema).toValidate(input);
      }
    });
  });
});
