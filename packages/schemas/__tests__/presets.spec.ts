import { it, expect, describe } from "vitest";
import { PresetNameSchema, PresetTypeSchema } from "../src/presets";

describe("presets schemas", () => {
  describe("PresetNameSchema", () => {
    it.each([
      { description: "valid preset name", input: "my_preset" },
    ] as const)("$description", ({ input }) => {
      expect(PresetNameSchema).toValidate(input);
    });
  });

  describe("PresetTypeSchema", () => {
    it.each([
      { description: "valid type full", input: "full" },
      { description: "valid type partial", input: "partial" },
    ] as const)("$description", ({ input }) => {
      expect(PresetTypeSchema).toValidate(input);
    });
  });
});
