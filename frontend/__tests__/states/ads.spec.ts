import { afterEach, describe, expect, it } from "vitest";

import { isTestPageHidingAds } from "../../src/ts/states/ads";
import { setVisiblePage } from "../../src/ts/states/router";
import { setTestFadedOut } from "../../src/ts/states/test";

describe("isTestPageHidingAds", () => {
  afterEach(() => {
    setVisiblePage("loading");
    setTestFadedOut(false);
  });

  it("hides the ads while the test page shows a test", () => {
    setVisiblePage("test");
    expect(isTestPageHidingAds()).toBe(true);
  });

  it("shows them once the test has faded out on finish", () => {
    setVisiblePage("test");
    setTestFadedOut(true);
    expect(isTestPageHidingAds()).toBe(false);
  });

  it("shows them on other pages, also before the test page has faded in", () => {
    // the route already says "test" while the old page fades out
    setVisiblePage("settings");
    expect(isTestPageHidingAds()).toBe(false);
  });
});
