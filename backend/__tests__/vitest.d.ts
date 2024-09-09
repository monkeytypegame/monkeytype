import type { Assertion, AsymmetricMatchersContaining } from "vitest";
import type { Test as SuperTest } from "supertest";

type ExpectedRateLimit = {
  /** max calls */
  max: number;
  /** window in milliseconds. Needs to be within 2500ms */
  windowMs: number;
};
interface RestRequestMatcher<R = Supertest> {
  toBeRateLimited: (expected: ExpectedRateLimit) => RestRequestMatcher<R>;
}

declare module "vitest" {
  interface Assertion<T = any> extends RestRequestMatcher<T> {}
  interface AsymmetricMatchersContaining extends RestRequestMatcher {}
}

interface MatcherResult {
  pass: boolean;
  message: () => string;
  actual?: unknown;
  expected?: unknown;
}
