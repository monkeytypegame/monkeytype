import { it, expect, describe } from "vitest";
import { ResultFilterPresetNameSchema } from "../src/users";

describe("users schemas", () => {
  describe("ResultFilterPresetNameSchema", () => {
    it.each([
      { description: "valid preset name", input: "my_preset" },
      {
        description: "invalid preset name too long",
        input: "a".repeat(17),
        expectedError: "String must contain at most 16 character(s)",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ResultFilterPresetNameSchema).toReject(input, expectedError);
      } else {
        expect(ResultFilterPresetNameSchema).toValidate(input);
      }
    });
  });
});
