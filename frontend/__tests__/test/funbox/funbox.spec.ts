import { describe, it, expect, beforeEach, vi } from "vitest";

// test state fetches keyboard layouts on load
vi.mock("../../../src/ts/utils/json-data", async (importOriginal) => ({
  ...(await importOriginal()),
  getLayout: vi.fn(async () => new Promise(() => undefined)),
}));

import "../../../src/ts/test/funbox/funbox";
import { setVisiblePage } from "../../../src/ts/states/router";
import {
  getAppliedFunboxes,
  getMemoryTimerDuration,
  isWordsWrapperHidden,
  setAppliedFunboxes,
  setMemoryTimerDuration,
  setWordsWrapperHidden,
} from "../../../src/ts/states/test";

describe("funbox", () => {
  beforeEach(() => {
    setVisiblePage("test");
    setAppliedFunboxes(["memory"]);
    setWordsWrapperHidden(true);
    setMemoryTimerDuration(5);
  });

  it("keeps the test's funboxes while the test page is shown", () => {
    // eg. fading out after it unmounted
    expect(getAppliedFunboxes()).toEqual(["memory"]);
  });

  it("clears the test's funboxes once another page is shown", () => {
    setVisiblePage("settings");

    expect(getAppliedFunboxes()).toEqual([]);
    expect(isWordsWrapperHidden()).toBe(false);
    expect(getMemoryTimerDuration()).toBeNull();
  });
});
