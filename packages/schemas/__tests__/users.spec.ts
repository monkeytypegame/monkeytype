import { it, expect, describe } from "vitest";
import { ResultFilterPresetNameSchema } from "../src/users";

describe("users schemas", () => {
  describe("ResultFilterPresetNameSchema", () => {
    it.each([
      { description: "valid preset name", input: "my_preset" },
    ] as const)("$description", ({ input }) => {
      expect(ResultFilterPresetNameSchema).toValidate(input);
    });
  });
});
