import { it, expect, describe } from "vitest";
import { PresetNameSchema, PresetTypeSchema } from "../src/presets";

describe("presets schemas", () => {
  describe("PresetNameSchema", () => {
    it.each([
      { description: "valid preset name", input: "my_preset" },
      {
        description: "invalid preset name too long",
        input: "a".repeat(17),
        expectedError: "String must contain at most 16 character(s)",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PresetNameSchema).toReject(input, expectedError);
      } else {
        expect(PresetNameSchema).toValidate(input);
      }
    });
  });

  describe("PresetTypeSchema", () => {
    it.each([
      { description: "valid type full", input: "full" },
      { description: "valid type partial", input: "partial" },
      {
        description: "invalid type",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'full' | 'partial', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PresetTypeSchema).toReject(input, expectedError);
      } else {
        expect(PresetTypeSchema).toValidate(input);
      }
    });
  });
});
