import type { Assertion, AsymmetricMatchersContaining } from "vitest";

interface ActivityDayMatchers<R = MonkeyTypes.TestActivityDay> {
  toBeDate: (date: string) => ActivityDayMatchers<R>;
  toHaveTests: (tests: number) => ActivityDayMatchers<R>;
  toHaveLevel: (level?: string | number) => ActivityDayMatchers<R>;
  toBeFiller: () => ActivityDayMatchers<R>;
}

declare module "vitest" {
  interface Assertion<T = any> extends ActivityDayMatchers<T> {}
  interface AsymmetricMatchersContaining extends ActivityDayMatchers {}
}

interface MatcherResult {
  pass: boolean;
  message: () => string;
  actual?: unknown;
  expected?: unknown;
}
