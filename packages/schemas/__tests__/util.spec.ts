import { describe, it, expect } from "vitest";
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
      {
        description: "valid numeric string",
        input: "123",
      },
      {
        description: "valid number",
        input: 123,
      },
      {
        description: "string with letters",
        input: "abc",
        expectedError:
          "Needs to be a number or a number represented as a string",
      },
      {
        description: "string with mixed content",
        input: "123abc",
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

  describe("token", () => {
    it.each([
      {
        description: "valid alphanumeric with underscore",
        input: "abc_123",
      },
      {
        description: "contains hyphen",
        input: "abc-123",
        expectedError: "Invalid",
      },
      {
        description: "contains space",
        input: "abc 123",
        expectedError: "Invalid",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      const schema = token();
      if (expectedError) {
        expect(schema).toReject(input, expectedError);
      } else {
        expect(schema).toValidate(input);
      }
    });
  });

  describe("slug", () => {
    it.each([
      {
        description: "valid slug with dots and hyphens",
        input: "abc-123_test.def",
      },
      {
        description: "starts with dot",
        input: ".invalid",
        expectedError: "Cannot start with a dot",
      },
      {
        description: "contains comma",
        input: "abc,def",
        expectedError:
          "Only letters, numbers, underscores, dots and hyphens allowed",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      const schema = slug();
      if (expectedError) {
        expect(schema).toReject(input, expectedError);
      } else {
        expect(schema).toValidate(input);
      }
    });
  });

  describe("nameWithSeparators", () => {
    it.each([
      {
        description: "valid name with separators",
        input: "abc_def-123",
      },
      {
        description: "starts with separator",
        input: "_invalid",
        expectedError: "Separators cannot be at the start or end",
      },
      {
        description: "consecutive separators",
        input: "inv__alid",
        expectedError: "Separators cannot be at the start or end",
      },
      {
        description: "contains dot",
        input: "invalid.name",
        expectedError: "Only letters, numbers, underscores and hyphens allowed",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      const schema = nameWithSeparators();
      if (expectedError) {
        expect(schema).toReject(input, expectedError);
      } else {
        expect(schema).toValidate(input);
      }
    });
  });

  describe("IdSchema", () => {
    it.each([
      {
        description: "valid id",
        input: "abc_123",
      },
      {
        description: "contains hyphen",
        input: "abc-123",
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
      {
        description: "valid tag within max length",
        input: "abc_123",
      },
      {
        description: "exceeds max length",
        input: "a".repeat(51),
        expectedError: "String must contain at most 50 character",
      },
      {
        description: "contains invalid character",
        input: "abc-123",
        expectedError: "Invalid",
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
      {
        description: "valid string",
        input: "hello",
      },
      {
        description: "null transforms to undefined",
        input: null,
      },
      {
        description: "undefined is accepted",
        input: undefined,
      },
      {
        description: "boolean is rejected",
        input: true,
        expectedError: "Expected string",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(NullableStringSchema).toReject(input, expectedError);
      } else {
        expect(NullableStringSchema).toValidate(input);
      }
    });
  });

  describe("PercentageSchema", () => {
    it.each([
      {
        description: "valid percentage",
        input: 50,
      },
      {
        description: "exceeds max",
        input: 101,
        expectedError: "Number must be less than or equal to 100",
      },
      {
        description: "negative value",
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
      {
        description: "valid wpm",
        input: 100,
      },
      {
        description: "exceeds max",
        input: 421,
        expectedError: "Number must be less than or equal to 420",
      },
      {
        description: "negative value",
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
      {
        description: "valid mode",
        input: "repeat",
      },
      {
        description: "invalid mode",
        input: "invalid",
        expectedError: "Invalid",
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
      {
        description: "valid limit mode",
        input: "word",
      },
      {
        description: "invalid limit mode",
        input: "invalid",
        expectedError: "Invalid",
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
      {
        description: "valid page number",
        input: 5,
      },
      {
        description: "negative value",
        input: -1,
        expectedError: "Number must be greater than or equal to 0",
      },
      {
        description: "non-integer",
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
