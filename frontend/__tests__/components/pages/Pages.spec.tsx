import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

type Animation = { el: HTMLElement; opacity: number; complete: () => void };

const { animations, target } = vi.hoisted(() => ({
  animations: [] as Animation[],
  target: {} as { get: () => string; set: (page: string) => void },
}));

vi.mock("animejs", () => ({
  animate: (
    el: HTMLElement,
    params: { opacity: number; duration: number; onComplete?: () => void },
  ) => {
    // initial styles are applied with a zero duration animation
    if (params.duration !== 0) {
      animations.push({
        el,
        opacity: params.opacity,
        complete: () => params.onComplete?.(),
      });
    }
    return { pause: vi.fn(), then: vi.fn() };
  },
}));

vi.mock("../../../src/ts/states/router", async () => {
  const { createSignal } = await import("solid-js");
  const [get, set] = createSignal("loading");
  target.get = get;
  target.set = set;
  return { getTargetPage: get };
});

function mockPage(name: string): () => { [key: string]: () => string } {
  return () => ({ [name]: () => name });
}
vi.mock("../../../src/ts/components/pages/404Page", mockPage("NotFoundPage"));
vi.mock("../../../src/ts/components/pages/AboutPage", mockPage("AboutPage"));
vi.mock(
  "../../../src/ts/components/pages/account-settings/AccountSettingsPage",
  mockPage("AccountSettingsPage"),
);
vi.mock(
  "../../../src/ts/components/pages/account/AccountPage",
  mockPage("AccountPage"),
);
vi.mock(
  "../../../src/ts/components/pages/connections/FriendsPage",
  mockPage("FriendsPage"),
);
vi.mock(
  "../../../src/ts/components/pages/leaderboard/LeaderboardPage",
  mockPage("LeaderboardPage"),
);
vi.mock(
  "../../../src/ts/components/pages/LoadingPage",
  mockPage("LoadingPage"),
);
vi.mock(
  "../../../src/ts/components/pages/login/LoginPage",
  mockPage("LoginPage"),
);
vi.mock(
  "../../../src/ts/components/pages/profile/ProfilePage",
  mockPage("ProfilePage"),
);
vi.mock(
  "../../../src/ts/components/pages/profile/ProfileSearchPage",
  mockPage("ProfileSearchPage"),
);
vi.mock(
  "../../../src/ts/components/pages/settings/SettingsPage",
  mockPage("SettingsPage"),
);
vi.mock("../../../src/ts/components/pages/test/TestPage", mockPage("TestPage"));

import { Pages } from "../../../src/ts/components/pages/Pages";

function renderPages(): HTMLElement {
  return render(() => <Pages />).container;
}

function mountedPage(container: HTMLElement): string | undefined {
  return container.querySelector(".page")?.id;
}

/** Finishes the last animation of the mounted page. */
function finishFade(container: HTMLElement): number {
  const el = container.querySelector<HTMLElement>(".page");
  const animation = animations.findLast((a) => a.el === el);
  if (animation === undefined) throw new Error("no animation running");
  animation.complete();
  return animation.opacity;
}

describe("Pages", () => {
  afterEach(() => {
    cleanup();
    animations.length = 0;
    target.set("loading");
  });

  it("fades the target page in", () => {
    const container = renderPages();
    expect(mountedPage(container)).toBe("pageLoading");
    expect(finishFade(container)).toBe(1);
  });

  it("fades the old page out before mounting the new one", () => {
    const container = renderPages();
    finishFade(container);

    target.set("about");
    expect(mountedPage(container)).toBe("pageLoading");
    expect(finishFade(container)).toBe(0);

    expect(mountedPage(container)).toBe("pageAbout");
    expect(finishFade(container)).toBe(1);
  });

  it("ends on the last target when it changes during a fade out", () => {
    const container = renderPages();
    finishFade(container);

    target.set("about");
    target.set("settings");
    expect(finishFade(container)).toBe(0);

    expect(mountedPage(container)).toBe("pageSettings");
  });

  it("fades back in when the target returns before the fade out ends", () => {
    const container = renderPages();
    finishFade(container);

    target.set("about");
    target.set("loading");
    expect(finishFade(container)).toBe(1);

    expect(mountedPage(container)).toBe("pageLoading");
  });
});
