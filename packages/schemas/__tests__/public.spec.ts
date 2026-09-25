import { it, expect, describe } from "vitest";
import { SpeedHistogramSchema, TypingStatsSchema } from "../src/public";

describe("public schemas", () => {
  describe("SpeedHistogramSchema", () => {
    it.each([
      {
        description: "valid record with numeric string keys and int values",
        input: {
          "10": 5,
          "20": 3,
        },
      },
      {
        description: "non-integer value fails",
        input: {
          "10": 1.5,
        },
        expectedError: "Expected integer, received float",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(SpeedHistogramSchema).toReject(input, expectedError);
      } else {
        expect(SpeedHistogramSchema).toValidate(input);
      }
    });
  });

  describe("TypingStatsSchema", () => {
    it.each([
      {
        description: "valid typing stats",
        input: {
          timeTyping: 100,
          testsCompleted: 10,
          testsStarted: 12,
        },
      },
      {
        description: "negative timeTyping fails",
        input: {
          timeTyping: -1,
          testsCompleted: 0,
          testsStarted: 0,
        },
        expectedError: "Number must be greater than or equal to 0",
      },
      {
        description: "non-integer testsCompleted fails",
        input: {
          timeTyping: 0,
          testsCompleted: 1.5,
          testsStarted: 0,
        },
        expectedError: "Expected integer, received float",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(TypingStatsSchema).toReject(input, expectedError);
      } else {
        expect(TypingStatsSchema).toValidate(input);
      }
    });
  });
});
