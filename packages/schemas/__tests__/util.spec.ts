import { it, expect, describe } from "vitest";
import {
  StringNumberSchema,
  token,
  slug,
  nameWithSeparators,
  IdSchema,
  TagSchema,
  NullableStringSchema,
  PercentageSchema,
  WpmSchema,
  CustomTextModeSchema,
  CustomTextLimitModeSchema,
  PageNumberSchema,
} from "../src/util";

describe("util schemas", () => {
  describe("StringNumberSchema", () => {
    it.each([
      { description: "valid number string", input: "10" },
      { description: "valid large number string", input: "123456" },
      { description: "valid number input", input: 10 },
      {
        description: "invalid string with letters",
        input: "abc123",
        expectedError:
          "Needs to be a number or a number represented as a string",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(StringNumberSchema).toReject(input, expectedError);
      } else {
        expect(StringNumberSchema).toValidate(input);
      }
    });
  });

  describe("token function", () => {
    const TokenSchema = token();
    it.each([
      { description: "valid token", input: "my_token_123" },
      {
        description: "invalid token with hyphen",
        input: "my-token",
        expectedError: "Invalid",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(TokenSchema).toReject(input, expectedError);
      } else {
        expect(TokenSchema).toValidate(input);
      }
    });
  });

  describe("slug function", () => {
    const SlugSchema = slug();
    it.each([
      { description: "valid slug", input: "my-slug" },
      {
        description: "valid slug with dots and underscores",
        input: "my.slug_name",
      },
      {
        description: "invalid slug starts with dot",
        input: ".hidden-slug",
        expectedError: "Cannot start with a dot",
      },
      {
        description: "invalid slug with special char",
        input: "my@slug",
        expectedError:
          "Only letters, numbers, underscores, dots and hyphens allowed",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(SlugSchema).toReject(input, expectedError);
      } else {
        expect(SlugSchema).toValidate(input);
      }
    });
  });

  describe("nameWithSeparators function", () => {
    const NameWithSeparatorsSchema = nameWithSeparators();
    it.each([
      { description: "valid name", input: "my-name" },
      { description: "valid name with underscores", input: "my_name" },
      {
        description: "invalid name starts with separator",
        input: "-my-name",
        expectedError: "Separators cannot be at the start or end",
      },
      {
        description: "invalid name with double separator",
        input: "my--name",
        expectedError: "Separators cannot be at the start or end",
      },
      {
        description: "invalid name with special char",
        input: "my@name",
        expectedError: "Only letters, numbers, underscores and hyphens allowed",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(NameWithSeparatorsSchema).toReject(input, expectedError);
      } else {
        expect(NameWithSeparatorsSchema).toValidate(input);
      }
    });
  });

  describe("IdSchema", () => {
    it.each([
      { description: "valid id", input: "test_id_123" },
      {
        description: "invalid id with hyphen",
        input: "test-id",
        expectedError: "Invalid",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(IdSchema).toReject(input, expectedError);
      } else {
        expect(IdSchema).toValidate(input);
      }
    });
  });

  describe("TagSchema", () => {
    it.each([
      { description: "valid tag under max length", input: "testtag" },
      { description: "tag at max length (50 chars)", input: "a".repeat(50) },
      {
        description: "tag exceeds max length",
        input: "a".repeat(51),
        expectedError: "String must contain at most 50 character(s)",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(TagSchema).toReject(input, expectedError);
      } else {
        expect(TagSchema).toValidate(input);
      }
    });
  });

  describe("NullableStringSchema", () => {
    it.each([
      { description: "valid string", input: "test" },
      { description: "valid null", input: null },
      { description: "valid undefined", input: undefined },
    ] as const)("$description", ({ input }) => {
      expect(NullableStringSchema).toValidate(input);
    });
  });

  describe("PercentageSchema", () => {
    it.each([
      { description: "valid percentage", input: 50 },
      { description: "valid 0%", input: 0 },
      { description: "valid 100%", input: 100 },
      {
        description: "percentage exceeds 100",
        input: 150,
        expectedError: "Number must be less than or equal to 100",
      },
      {
        description: "negative percentage",
        input: -1,
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PercentageSchema).toReject(input, expectedError);
      } else {
        expect(PercentageSchema).toValidate(input);
      }
    });
  });

  describe("WpmSchema", () => {
    it.each([
      { description: "valid wpm", input: 100 },
      { description: "valid 0 wpm", input: 0 },
      { description: "valid max wpm (420)", input: 420 },
      {
        description: "wpm exceeds max",
        input: 500,
        expectedError: "Number must be less than or equal to 420",
      },
      {
        description: "negative wpm",
        input: -1,
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(WpmSchema).toReject(input, expectedError);
      } else {
        expect(WpmSchema).toValidate(input);
      }
    });
  });

  describe("CustomTextModeSchema", () => {
    it.each([
      { description: "valid repeat", input: "repeat" },
      { description: "valid random", input: "random" },
      { description: "valid shuffle", input: "shuffle" },
      {
        description: "invalid mode",
        input: "invalid",
        expectedError: "Invalid enum value",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(CustomTextModeSchema).toReject(input, expectedError);
      } else {
        expect(CustomTextModeSchema).toValidate(input);
      }
    });
  });

  describe("CustomTextLimitModeSchema", () => {
    it.each([
      { description: "valid word", input: "word" },
      { description: "valid time", input: "time" },
      { description: "valid section", input: "section" },
      {
        description: "invalid mode",
        input: "invalid",
        expectedError: "Invalid enum value",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(CustomTextLimitModeSchema).toReject(input, expectedError);
      } else {
        expect(CustomTextLimitModeSchema).toValidate(input);
      }
    });
  });

  describe("PageNumberSchema", () => {
    it.each([
      { description: "valid page number", input: 0 },
      { description: "valid positive page", input: 5 },
      {
        description: "invalid negative page",
        input: -1,
        expectedError: "Number must be greater than or equal to 0",
      },
      {
        description: "invalid non-integer",
        input: 1.5,
        expectedError: "Expected integer, received float",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PageNumberSchema).toReject(input, expectedError);
      } else {
        expect(PageNumberSchema).toValidate(input);
      }
    });
  });
});
