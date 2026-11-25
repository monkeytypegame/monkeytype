import { it, expect, describe } from "vitest";
import { LanguageSchema, LanguageObjectSchema } from "../src/languages";

describe("languages schemas", () => {
  describe("LanguageSchema", () => {
    it.each([
      { description: "valid language english", input: "english" },
      { description: "valid language spanish", input: "spanish" },
      {
        description: "invalid language",
        input: "invalid_language",
        expectedError: "Must be a supported language",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(LanguageSchema).toReject(input, expectedError);
      } else {
        expect(LanguageSchema).toValidate(input);
      }
    });
  });

  describe("LanguageObjectSchema", () => {
    it.each([
      {
        description: "valid language object",
        input: {
          name: "english",
          words: ["hello", "world"],
        },
      },
      {
        description: "invalid - missing name",
        input: { words: ["hello", "world"] },
        expectedError: "Required",
      },
      {
        description: "invalid - missing words",
        input: { name: "english" },
        expectedError: "Required",
      },
      {
        description: "invalid - extra property",
        input: { name: "english", words: ["hello"], extra: true },
        expectedError: "Unrecognized key",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(LanguageObjectSchema).toReject(input, expectedError);
      } else {
        expect(LanguageObjectSchema).toValidate(input);
      }
    });
  });
});
