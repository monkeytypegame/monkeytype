import { it, expect, describe } from "vitest";
import { PSASchema } from "../src/psas";

describe("psas schemas", () => {
  describe("PSASchema", () => {
    it.each([
      {
        description: "minimal valid PSA",
        input: {
          _id: "abc123",
          message: "Important announcement",
        },
      },
      {
        description: "valid PSA with all fields",
        input: {
          _id: "psa_001",
          message: "Server maintenance",
          date: 1700000000,
          level: 2,
          sticky: true,
        },
      },
      {
        description: "invalid _id with special characters",
        input: {
          _id: "abc@123",
          message: "Test",
        },
        expectedError: "Invalid",
      },
      {
        description: "missing message",
        input: {
          _id: "abc123",
        },
        expectedError: "Required",
      },
      {
        description: "date is negative",
        input: {
          _id: "abc123",
          message: "Test",
          date: -1,
        },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(PSASchema).toReject(input, expectedError);
      } else {
        expect(PSASchema).toValidate(input);
      }
    });
  });
});
