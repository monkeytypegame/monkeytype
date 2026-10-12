import { it, expect, describe } from "vitest";
import {
  DifficultySchema,
  PersonalBestSchema,
  PersonalBestsSchema,
  DefaultWordsModeSchema,
  DefaultTimeModeSchema,
  QuoteLengthSchema,
  ModeSchema,
  Mode2Schema,
} from "../src/shared";

describe("shared schemas", () => {
  describe("DifficultySchema", () => {
    it.each([
      { description: "valid normal", input: "normal" },
      { description: "valid expert", input: "expert" },
      { description: "valid master", input: "master" },
      {
        description: "invalid difficulty",
        input: "invalid",
        expectedError: "Invalid enum value",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(DifficultySchema).toReject(input, expectedError);
      } else {
        expect(DifficultySchema).toValidate(input);
      }
    });
  });

  describe("PersonalBestSchema", () => {
    it.each([
      {
        description: "valid personal best",
        input: {
          acc: 95,
          consistency: 90,
          difficulty: "normal",
          language: "english",
          raw: 120,
          wpm: 100,
          timestamp: 1234567890,
        },
      },
      {
        description: "acc exceeds 100",
        input: {
          acc: 101,
          consistency: 90,
          difficulty: "normal",
          language: "english",
          raw: 120,
          wpm: 100,
          timestamp: 1234567890,
        },
        expectedError: "Number must be less than or equal to 100",
      },
      {
        description: "wpm is negative",
        input: {
          acc: 95,
          consistency: 90,
          difficulty: "normal",
          language: "english",
          raw: -1,
          wpm: 100,
          timestamp: 1234567890,
        },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PersonalBestSchema).toReject(input, expectedError);
      } else {
        expect(PersonalBestSchema).toValidate(input);
      }
    });
  });

  describe("PersonalBestsSchema", () => {
    it.each([
      {
        description: "valid personal bests record",
        input: {
          time: {
            "10": [
              {
                acc: 95,
                consistency: 90,
                difficulty: "normal",
                language: "english",
                raw: 120,
                wpm: 100,
                timestamp: 1234567890,
              },
            ],
          },
          words: {
            "10": [
              {
                acc: 95,
                consistency: 90,
                difficulty: "normal",
                language: "english",
                raw: 120,
                wpm: 100,
                timestamp: 1234567890,
              },
            ],
          },
          quote: {
            "1": [
              {
                acc: 95,
                consistency: 90,
                difficulty: "normal",
                language: "english",
                raw: 120,
                wpm: 100,
                timestamp: 1234567890,
              },
            ],
          },
          custom: {
            custom: [
              {
                acc: 95,
                consistency: 90,
                difficulty: "normal",
                language: "english",
                raw: 120,
                wpm: 100,
                timestamp: 1234567890,
              },
            ],
          },
          zen: {
            zen: [
              {
                acc: 95,
                consistency: 90,
                difficulty: "normal",
                language: "english",
                raw: 120,
                wpm: 100,
                timestamp: 1234567890,
              },
            ],
          },
        },
      },
      {
        description: "invalid personal best in record",
        input: {
          time: {
            "10": [
              {
                acc: 95,
                consistency: 90,
                difficulty: "normal",
                language: "english",
                raw: 120,
                wpm: -1,
                timestamp: 1234567890,
              },
            ],
          },
          words: {},
          quote: {},
          custom: { custom: [] },
          zen: { zen: [] },
        },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PersonalBestsSchema).toReject(input, expectedError);
      } else {
        expect(PersonalBestsSchema).toValidate(input);
      }
    });
  });

  describe("DefaultWordsModeSchema", () => {
    it.each([
      { description: "valid 10", input: "10" },
      { description: "valid 25", input: "25" },
      { description: "valid 50", input: "50" },
      { description: "valid 100", input: "100" },
      {
        description: "invalid mode",
        input: "30",
        expectedError: "Invalid input",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(DefaultWordsModeSchema).toReject(input, expectedError);
      } else {
        expect(DefaultWordsModeSchema).toValidate(input);
      }
    });
  });

  describe("DefaultTimeModeSchema", () => {
    it.each([
      { description: "valid 15", input: "15" },
      { description: "valid 30", input: "30" },
      { description: "valid 60", input: "60" },
      { description: "valid 120", input: "120" },
      {
        description: "invalid mode",
        input: "45",
        expectedError: "Invalid input",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(DefaultTimeModeSchema).toReject(input, expectedError);
      } else {
        expect(DefaultTimeModeSchema).toValidate(input);
      }
    });
  });

  describe("QuoteLengthSchema", () => {
    it.each([
      { description: "valid short", input: "short" },
      { description: "valid medium", input: "medium" },
      { description: "valid long", input: "long" },
      { description: "valid thicc", input: "thicc" },
      {
        description: "invalid length",
        input: "tiny",
        expectedError: "Invalid input",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(QuoteLengthSchema).toReject(input, expectedError);
      } else {
        expect(QuoteLengthSchema).toValidate(input);
      }
    });
  });

  describe("ModeSchema", () => {
    it.each([
      { description: "valid mode time", input: "time" },
      { description: "valid mode words", input: "words" },
      { description: "valid mode quote", input: "quote" },
      { description: "valid mode custom", input: "custom" },
      { description: "valid mode zen", input: "zen" },
      {
        description: "invalid mode",
        input: "invalid",
        expectedError:
          "Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'invalid'",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ModeSchema).toReject(input, expectedError);
      } else {
        expect(ModeSchema).toValidate(input);
      }
    });
  });

  describe("Mode2Schema", () => {
    it.each([
      { description: "valid number string", input: "10" },
      { description: "valid zen", input: "zen" },
      { description: "valid custom", input: "custom" },
      {
        description: "invalid value",
        input: "invalid",
        expectedError:
          "Needs to be a number or a number represented as a string",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(Mode2Schema).toReject(input, expectedError);
      } else {
        expect(Mode2Schema).toValidate(input);
      }
    });
  });
});
