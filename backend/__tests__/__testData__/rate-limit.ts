import { REQUEST_MULTIPLIER } from "../../src/middlewares/rate-limit";
import { MatcherResult, ExpectedRateLimit } from "../vitest";
import { Test as SuperTest } from "supertest";

export function enableRateLimitExpects(): void {
  expect.extend({
    toBeRateLimited: async (
      received: SuperTest,
      expected: ExpectedRateLimit
    ): Promise<MatcherResult> => {
      const now = Date.now();
      const { headers } = await received.expect(200);

      const max =
        parseInt(headers["x-ratelimit-limit"] as string) / REQUEST_MULTIPLIER;
      const windowMs =
        parseInt(headers["x-ratelimit-reset"] as string) * 1000 - now;

      return {
        pass:
          max === expected.max && Math.abs(expected.windowMs - windowMs) < 2500,
        message: () =>
          "Rate limit max not matching or windowMs is off by more then 2500ms",
        actual: { max, windowMs },
        expected: expected,
      };
    },
  });
}
