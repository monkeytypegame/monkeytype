import type { Assertion, AsymmetricMatchersContaining } from "vitest";
import type { ActivityDay } from "../src/ts/elements/test-activity";

interface ActivityDayMatchers<R = ActivityDay> {
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
  // If you pass these, they will automatically appear inside a diff when
  // the matcher does not pass, so you don't need to print the diff yourself
  actual?: unknown;
  expected?: unknown;
}
