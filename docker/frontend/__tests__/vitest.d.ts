import type { Assertion, AsymmetricMatchersContaining } from "vitest";
import { TestActivityDay } from "../src/ts/elements/test-activity-calendar";

interface ActivityDayMatchers<R = TestActivityDay> {
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
