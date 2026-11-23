import { describe, it, expect, beforeEach } from "vitest";
import { __testing } from "../../src/ts/config/testing";
import { setConfig } from "../../src/ts/config/setters";
import {
  getPrefersArabicLazyMode,
  setPrefersArabicLazyMode,
} from "../../src/ts/states/lazy-mode";

describe("arabic lazy mode preference", () => {
  beforeEach(() => {
    __testing.replaceConfig({ language: "arabic", lazyMode: true });
    setPrefersArabicLazyMode(true);
  });

  it("follows the user's lazy mode change in arabic", () => {
    setConfig("lazyMode", false);
    expect(getPrefersArabicLazyMode()).toBe(false);
  });

  it("ignores writes that don't save", () => {
    setConfig("lazyMode", false, { nosave: true });
    expect(getPrefersArabicLazyMode()).toBe(true);
  });

  it("ignores other languages", () => {
    __testing.replaceConfig({ language: "english", lazyMode: true });
    setConfig("lazyMode", false);
    expect(getPrefersArabicLazyMode()).toBe(true);
  });
});
