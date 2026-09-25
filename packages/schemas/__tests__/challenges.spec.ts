import { it, expect, describe } from "vitest";
import { ChallengeSchema } from "../src/challenges";

describe("challenges schema", () => {
  describe("ChallengeSchema", () => {
    it.each([
      {
        description: "minimal valid challenge",
        input: {
          name: "test-challenge",
          display: "Test Challenge",
          type: "other",
          parameters: [],
        },
      },
      {
        description: "full challenge with requirements",
        input: {
          name: "speed-run",
          display: "Speed Run",
          autoRole: true,
          type: "customTime",
          message: "Complete quickly",
          parameters: [60, true, null, "easy", ["58008"]],
          requirements: {
            wpm: { min: 100 },
            acc: { exact: 0.95 },
            afk: { max: 5 },
            time: { min: 60 },
            funbox: { exact: ["58008"] },
            raw: { exact: 120 },
            con: { exact: 10 },
            config: { punctuation: true },
          },
        },
      },
      {
        description: "exact wpm challenge",
        input: {
          name: "exact-wpm",
          display: "Exact WPM",
          type: "accuracy",
          parameters: [],
          requirements: { wpm: { exact: 50 } },
        },
      },
      {
        description: "missing name",
        input: { display: "Test", type: "other", parameters: [] },
        expectedError: "Required",
      },
      {
        description: "missing display",
        input: { name: "test", type: "other", parameters: [] },
        expectedError: "Required",
      },
      {
        description: "missing type",
        input: { name: "test", display: "Test", parameters: [] },
        expectedError: "Required",
      },
      {
        description: "invalid type enum",
        input: {
          name: "test",
          display: "Test",
          type: "invalid",
          parameters: [],
        },
        expectedError: "Invalid enum value",
      },
      {
        description: "unrecognized key",
        input: {
          name: "test",
          display: "Test",
          type: "other",
          parameters: [],
          extra: true,
        },
        expectedError: "Unrecognized key",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ChallengeSchema).toReject(input, expectedError);
      } else {
        expect(ChallengeSchema).toValidate(input);
      }
    });
  });
});
