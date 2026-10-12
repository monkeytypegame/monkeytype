import { it, expect, describe } from "vitest";
import { FontNameSchema } from "../src/fonts";

describe("fonts schemas", () => {
  describe("FontNameSchema", () => {
    it.each([
      { description: "valid known font Roboto_Mono", input: "Roboto_Mono" },
      { description: "valid known font Inter_Tight", input: "Inter_Tight" },
      {
        description: "valid custom font with underscore",
        input: "Custom_Font",
      },
      { description: "valid custom font with hyphen", input: "Custom-Font" },
      {
        description: "invalid font with space",
        input: "Custom Font",
        expectedError: "Invalid",
      },
      {
        description: "invalid font exceeds max length 50",
        input: "a".repeat(51),
        expectedError: "String must contain at most 50 character",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(FontNameSchema).toReject(input, expectedError);
      } else {
        expect(FontNameSchema).toValidate(input);
      }
    });
  });
});
