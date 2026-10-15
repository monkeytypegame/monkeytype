import { beforeEach, describe, expect, it, vi } from "vitest";

// the shown page finishes fading in when the test says so
const shownPage = vi.hoisted(() => {
  let resolve = (): void => undefined;
  let shown = Promise.resolve();
  return {
    reset: (): void => {
      shown = new Promise<void>((r) => (resolve = r));
    },
    finish: (): void => resolve(),
    wait: async (): Promise<void> => shown,
  };
});

vi.mock("../../src/ts/components/pages/Pages", () => ({
  waitForShownPage: shownPage.wait,
}));
vi.mock("../../src/ts/test/test-logic", () => ({
  leaveTestPage: vi.fn(),
  stop: vi.fn(),
}));
vi.mock("../../src/ts/test/focus", () => ({ set: vi.fn() }));
vi.mock("../../src/ts/controllers/ad-controller", () => ({
  reinstate: vi.fn(),
}));

import { change, isNavigating } from "../../src/ts/controllers/page-controller";
import { getActivePage } from "../../src/ts/states/core";

describe("page-controller navigation guard", () => {
  beforeEach(() => shownPage.reset());

  it("is navigating at boot, until the first navigation finishes", async () => {
    expect(isNavigating()).toBe(true);
    expect(await change("about")).toBe(false);
    expect(getActivePage()).toBe("loading");

    const first = change("settings", { force: true });
    await vi.waitFor(() => expect(getActivePage()).toBe("settings"));
    expect(isNavigating()).toBe(true);

    shownPage.finish();
    expect(await first).toBe(true);
    expect(isNavigating()).toBe(false);
  });

  it("ignores a navigation started during another one", async () => {
    const navigation = change("about");
    expect(isNavigating()).toBe(true);
    expect(await change("login")).toBe(false);

    await vi.waitFor(() => expect(getActivePage()).toBe("about"));
    shownPage.finish();
    expect(await navigation).toBe(true);
    expect(getActivePage()).toBe("about");
    expect(isNavigating()).toBe(false);
  });
});
