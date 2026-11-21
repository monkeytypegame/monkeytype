import { it, expect, describe } from "vitest";
import { ThemeNameSchema } from "../src/themes";

describe("themes schemas", () => {
  describe("ThemeNameSchema", () => {
    it.each([
      { description: "valid theme dracula", input: "dracula" },
      { description: "valid theme rose_pine", input: "rose_pine" },
      { description: "valid theme future_funk", input: "future_funk" },
      {
        description: "invalid theme",
        input: "invalid_theme",
        expectedError: "Must be a known theme",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ThemeNameSchema).toReject(input, expectedError);
      } else {
        expect(ThemeNameSchema).toValidate(input);
      }
    });
  });
});
