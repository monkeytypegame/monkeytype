import { it, expect, describe } from "vitest";
import {
  PresetNameSchema,
  PresetTypeSchema,
  PresetSchema,
  EditPresetRequestSchema,
} from "../src/presets";

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
      if (expectedError !== undefined) {
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
      if (expectedError !== undefined) {
        expect(PresetTypeSchema).toReject(input, expectedError);
      } else {
        expect(PresetTypeSchema).toValidate(input);
      }
    });
  });

  describe("PresetSchema", () => {
    const validPresetMinimal = {
      _id: "preset123",
      name: "my_preset",
      config: {},
    };

    const validPresetWithConfig = {
      _id: "preset123",
      name: "my_preset",
      config: { punctuation: true },
    };

    const validPresetWithSettingGroups = {
      _id: "preset123",
      name: "my_preset",
      settingGroups: ["test", "behavior"],
      config: {},
    };

    it.each([
      { description: "valid preset minimal", input: validPresetMinimal },
      { description: "valid preset with config", input: validPresetWithConfig },
      {
        description: "valid preset with settingGroups",
        input: validPresetWithSettingGroups,
      },
      {
        description: "invalid - missing name",
        input: { _id: "preset123" },
        expectedError: "Required",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(PresetSchema).toReject(input, expectedError);
      } else {
        expect(PresetSchema).toValidate(input);
      }
    });
  });

  describe("EditPresetRequestSchema", () => {
    it.each([
      {
        description: "valid edit preset request with all required fields",
        input: { _id: "preset123", name: "updated_preset" },
        expectedError: undefined,
      },
      {
        description: "valid edit preset request with config update",
        input: { _id: "preset123", name: "updated_preset", config: {} },
        expectedError: undefined,
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(EditPresetRequestSchema).toReject(input, expectedError);
      } else {
        expect(EditPresetRequestSchema).toValidate(input);
      }
    });
  });
});
