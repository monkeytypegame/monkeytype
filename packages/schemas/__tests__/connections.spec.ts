import { describe, it, expect } from "vitest";
import {
  ConnectionStatusSchema,
  ConnectionTypeSchema,
  ConnectionSchema,
} from "../src/connections";

describe("ConnectionStatusSchema", () => {
  it.each([
    { description: "valid status: pending", input: "pending" },
    { description: "valid status: accepted", input: "accepted" },
    { description: "valid status: blocked", input: "blocked" },
    {
      description: "invalid status",
      input: "unknown",
      expectedError: "Invalid enum value",
    },
  ] as const)("$description", ({ input, expectedError }) => {
    if (expectedError) {
      expect(ConnectionStatusSchema).toReject(input, expectedError);
    } else {
      expect(ConnectionStatusSchema).toValidate(input);
    }
  });
});

describe("ConnectionTypeSchema", () => {
  it.each([
    { description: "valid type: incoming", input: "incoming" },
    { description: "valid type: outgoing", input: "outgoing" },
    {
      description: "invalid type",
      input: "unknown",
      expectedError: "Invalid enum value",
    },
  ] as const)("$description", ({ input, expectedError }) => {
    if (expectedError) {
      expect(ConnectionTypeSchema).toReject(input, expectedError);
    } else {
      expect(ConnectionTypeSchema).toValidate(input);
    }
  });
});

describe("ConnectionSchema", () => {
  it.each([
    {
      description: "valid connection",
      input: {
        _id: "abc_123",
        initiatorUid: "user_1",
        initiatorName: "Alice",
        receiverUid: "user_2",
        receiverName: "Bob",
        lastModified: 1700000000,
        status: "pending",
      },
    },
    {
      description: "invalid status",
      input: {
        _id: "abc_123",
        initiatorUid: "user_1",
        initiatorName: "Alice",
        receiverUid: "user_2",
        receiverName: "Bob",
        lastModified: 1700000000,
        status: "unknown",
      },
      expectedError: "Invalid enum value",
    },
    {
      description: "negative lastModified",
      input: {
        _id: "abc_123",
        initiatorUid: "user_1",
        initiatorName: "Alice",
        receiverUid: "user_2",
        receiverName: "Bob",
        lastModified: -1,
        status: "pending",
      },
      expectedError: "Number must be greater than or equal to 0",
    },
  ] as const)("$description", ({ input, expectedError }) => {
    if (expectedError) {
      expect(ConnectionSchema).toReject(input, expectedError);
    } else {
      expect(ConnectionSchema).toValidate(input);
    }
  });
});
