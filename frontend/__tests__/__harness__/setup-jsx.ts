//extend expect with dom matchers
import "@testing-library/jest-dom";
import { afterEach } from "vitest";

// reset config to defaults after each test, so a test's config can't leak
// into the next. Imported lazily, so config loads after the spec's mocks
afterEach(async () => {
  const { __testing } = await import("../../src/ts/config/testing");
  __testing.replaceConfig({});
});
