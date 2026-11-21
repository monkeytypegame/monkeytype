import { it, expect, describe } from "vitest";
import { ChallengeNameSchema } from "../src/challenges";

describe("challenges schema", () => {
  describe("ChallengeNameSchema", () => {
    it.each([
      {
        description: "valid challenge oneHourWarrior",
        input: "oneHourWarrior",
      },
      { description: "valid challenge doubleDown", input: "doubleDown" },
      { description: "valid challenge crosstalk", input: "crosstalk" },
      { description: "valid numeric challenge name 69", input: "69" },
      {
        description: "invalid challenge name",
        input: "invalidChallenge",
        expectedError: "Must be a known challenge name",
      },
      {
        description: "non-string input",
        input: 123,
        expectedError: "Required",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ChallengeNameSchema).toReject(input, expectedError);
      } else {
        expect(ChallengeNameSchema).toValidate(input);
      }
    });
  });
});
