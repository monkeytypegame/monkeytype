import { it, expect, describe } from "vitest";
import { LayoutNameSchema } from "../src/layouts";

describe("layouts schemas", () => {
  describe("LayoutNameSchema", () => {
    it.each([
      { description: "valid layout qwerty", input: "qwerty" },
      { description: "valid layout dvorak", input: "dvorak" },
      { description: "valid layout colemak_dh", input: "colemak_dh" },
      {
        description: "invalid layout",
        input: "invalid_layout",
        expectedError: "Must be a supported layout",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(LayoutNameSchema).toReject(input, expectedError);
      } else {
        expect(LayoutNameSchema).toValidate(input);
      }
    });
  });
});
