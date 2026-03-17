import { expect } from "vitest";
import MonkeyError from "../../src/utils/error";
import { MatcherResult } from "../vitest";

export function enableMonkeyErrorExpects(): void {
  expect.extend({
    toMatchMonkeyError(
      received: MonkeyError,
      expected: MonkeyError,
    ): MatcherResult {
      return {
        pass:
          received.status === expected.status &&
          received.message === expected.message,
        message: () => "MonkeyError does not match:",
        actual: { status: received.status, message: received.message },
        expected: { status: expected.status, message: expected.message },
      };
    },
  });
}
