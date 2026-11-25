import { render } from "@solidjs/testing-library";
import { describe, it, expect, beforeEach, vi } from "vitest";

// test state fetches keyboard layouts on load
vi.mock("../../../src/ts/utils/json-data", async (importOriginal) => ({
  ...(await importOriginal()),
  getLayout: vi.fn(async () => new Promise(() => undefined)),
}));

import { Funbox } from "../../../src/ts/components/core/Funbox";
import { setConfigStore } from "../../../src/ts/config/store";
import { setIsScreenshotting } from "../../../src/ts/states/core";
import { setAppliedFunboxes } from "../../../src/ts/states/test";

function funboxLinks(): string[] {
  return [...document.head.querySelectorAll("link.funBoxTheme")].map(
    (it) => it.getAttribute("href") ?? "",
  );
}

describe("Funbox component", () => {
  beforeEach(() => {
    setConfigStore("funbox", []);
    setAppliedFunboxes([]);
    setIsScreenshotting(false);
  });

  it("applies body classes and stylesheets for applied funboxes", () => {
    render(() => <Funbox />);
    setAppliedFunboxes(["nausea", "read_ahead_easy"]);

    expect(document.body.classList).toContain("fb-nausea");
    expect(document.body.classList).toContain("fb-read-ahead-easy");
    expect(document.body.classList).toContain("ignore-reduced-motion");
    expect(funboxLinks()).toEqual([
      "funbox/nausea.css",
      "funbox/read_ahead_easy.css",
    ]);
  });

  it("follows applied funboxes, not the config", () => {
    render(() => <Funbox />);
    setConfigStore("funbox", ["nausea"]);

    expect(document.body.classList).not.toContain("fb-nausea");
    expect(funboxLinks()).toEqual([]);
  });

  it("removes test state when applied funboxes are cleared", () => {
    render(() => <Funbox />);
    setAppliedFunboxes(["nausea"]);
    setAppliedFunboxes([]);

    expect(document.body.classList).not.toContain("fb-nausea");
    expect(document.body.classList).not.toContain("ignore-reduced-motion");
    expect(funboxLinks()).toEqual([]);
  });

  it("applies crt mode from the config", () => {
    render(() => <Funbox />);
    setConfigStore("funbox", ["crt"]);

    expect(document.body.classList).toContain("crtmode");
    expect(document.getElementById("scanline")).not.toBeNull();
    expect(
      document.getElementById("globalFunBoxTheme")?.getAttribute("href"),
    ).toBe("funbox/crt.css");
  });

  it("hides crt mode while screenshotting", () => {
    setConfigStore("funbox", ["crt"]);
    render(() => <Funbox />);
    setIsScreenshotting(true);

    expect(document.body.classList).not.toContain("crtmode");
    expect(document.getElementById("scanline")).toBeNull();
    expect(document.getElementById("globalFunBoxTheme")).toBeNull();
  });

  it("removes everything on unmount", () => {
    setConfigStore("funbox", ["crt"]);
    setAppliedFunboxes(["nausea"]);
    const { unmount } = render(() => <Funbox />);
    unmount();

    expect(document.body.classList).not.toContain("crtmode");
    expect(document.body.classList).not.toContain("fb-nausea");
    expect(document.getElementById("scanline")).toBeNull();
    expect(document.getElementById("globalFunBoxTheme")).toBeNull();
    expect(funboxLinks()).toEqual([]);
  });
});
