import { it, expect, describe } from "vitest";
import {
  ApeKeyNameSchema,
  ApeKeyUserDefinedSchema,
  ApeKeySchema,
  ApeKeysSchema,
} from "../src/ape-keys";

describe("ape-keys schemas", () => {
  describe("ApeKeyNameSchema", () => {
    it.each([
      {
        description: "valid slug within max length",
        input: "my-ape-key",
      },
      {
        description: "exceeds max length",
        input: "this-name-is-way-too-long-for-schema",
        expectedError: "String must contain at most 20 character",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ApeKeyNameSchema).toReject(input, expectedError);
      } else {
        expect(ApeKeyNameSchema).toValidate(input);
      }
    });
  });

  describe("ApeKeyUserDefinedSchema", () => {
    it.each([
      {
        description: "minimal valid user-defined ape key",
        input: {
          name: "test-key",
          enabled: true,
        },
      },
      {
        description: "missing name",
        input: { enabled: false },
        expectedError: "Required",
      },
      {
        description: "missing enabled",
        input: { name: "test-key" },
        expectedError: "Required",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ApeKeyUserDefinedSchema).toReject(input, expectedError);
      } else {
        expect(ApeKeyUserDefinedSchema).toValidate(input);
      }
    });
  });

  describe("ApeKeySchema", () => {
    it.each([
      {
        description: "minimal valid ape key",
        input: {
          name: "test-key",
          enabled: true,
          createdOn: 0,
          modifiedOn: 0,
          lastUsedOn: 0,
        },
      },
      {
        description: "lastUsedOn is -1",
        input: {
          name: "test-key",
          enabled: false,
          createdOn: 1234567890,
          modifiedOn: 1234567890,
          lastUsedOn: -1,
        },
      },
      {
        description: "missing createdOn",
        input: {
          name: "test-key",
          enabled: true,
          modifiedOn: 0,
          lastUsedOn: 0,
        },
        expectedError: "Required",
      },
      {
        description: "createdOn negative",
        input: {
          name: "test-key",
          enabled: true,
          createdOn: -1,
          modifiedOn: 0,
          lastUsedOn: 0,
        },
        expectedError: "Number must be greater than or equal to 0",
      },
      {
        description: "lastUsedOn negative and not -1",
        input: {
          name: "test-key",
          enabled: true,
          createdOn: 0,
          modifiedOn: 0,
          lastUsedOn: -2,
        },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ApeKeySchema).toReject(input, expectedError);
      } else {
        expect(ApeKeySchema).toValidate(input);
      }
    });
  });

  describe("ApeKeysSchema", () => {
    it.each([
      {
        description: "valid record of ape keys",
        input: {
          key1: {
            name: "test-key",
            enabled: true,
            createdOn: 0,
            modifiedOn: 0,
            lastUsedOn: 0,
          },
        },
      },
      {
        description: "invalid value in record",
        input: {
          key1: {
            name: "test-key",
            enabled: true,
            createdOn: -1,
            modifiedOn: 0,
            lastUsedOn: 0,
          },
        },
        expectedError: "Number must be greater than or equal to 0",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError) {
        expect(ApeKeysSchema).toReject(input, expectedError);
      } else {
        expect(ApeKeysSchema).toValidate(input);
      }
    });
  });
});
