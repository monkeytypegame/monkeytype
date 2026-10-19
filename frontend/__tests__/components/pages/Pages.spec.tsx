import { cleanup, render } from "@solidjs/testing-library";
import { batch, JSXElement, onCleanup, onMount } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PageRegistry,
  Pages,
  waitForShownPage,
} from "../../../src/ts/components/pages/Pages";
import { PageName } from "../../../src/ts/pages/page";
import { setActivePage, setUserId } from "../../../src/ts/states/core";
import { setLoadingShown } from "../../../src/ts/states/loading-page";

type Fade = { el: HTMLElement; opacity: number; complete: () => void };
const fades: Fade[] = [];

// opacity fades queue up until finished by the test. Like anime's default
// composition, a new animation on an element replaces the running one
vi.mock("animejs", () => ({
  animate: (
    el: HTMLElement,
    params: { opacity?: number; duration: number; onComplete?: () => void },
  ) => {
    if (params.opacity !== undefined) {
      const replaced = fades.findIndex((fade) => fade.el === el);
      if (replaced !== -1) fades.splice(replaced, 1);
      const fade: Fade = {
        el,
        opacity: params.opacity,
        complete: () => {
          fades.splice(fades.indexOf(fade), 1);
          params.onComplete?.();
        },
      };
      fades.push(fade);
    }
    return { pause: vi.fn() };
  },
}));

const events: string[] = [];

function stubPage(name: string): () => JSXElement {
  return () => {
    const el = document.createElement("span");
    el.textContent = `${name} content`;
    onMount(() =>
      events.push(`mount ${name}${el.isConnected ? "" : " detached"}`),
    );
    onCleanup(() => events.push(`cleanup ${name}`));
    return el;
  };
}

const registry: PageRegistry = {
  loading: { component: stubPage("loading"), class: "loadingClass" },
  test: { component: stubPage("test") },
  settings: { component: stubPage("settings") },
  about: { component: stubPage("about"), class: "full-width" },
  account: { component: stubPage("account"), needsAuthentication: true },
  login: { component: stubPage("login") },
  profile: { component: stubPage("profile") },
  profileSearch: { component: stubPage("profileSearch") },
  404: { component: stubPage("404") },
  accountSettings: { component: stubPage("accountSettings") },
  leaderboards: { component: stubPage("leaderboards") },
  friends: { component: stubPage("friends") },
};

function pagesInDom(): string[] {
  return [...document.querySelectorAll(".page")].map((el) => el.id);
}

async function settleMicrotasks(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

/** Runs pending microtasks, the next animation frame, then microtasks again. */
async function flush(): Promise<void> {
  await settleMicrotasks();
  vi.advanceTimersToNextFrame();
  await settleMicrotasks();
}

async function finishFade(): Promise<void> {
  fades[0]?.complete();
  await flush();
}

/** Fades the shown page out and the next one in. */
async function finishPageChange(): Promise<void> {
  await finishFade();
  await finishFade();
}

function renderPages(initial: PageName = "loading"): void {
  setActivePage(initial);
  render(() => <Pages registry={registry} />);
}

describe("Pages", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame"],
    });
    fades.length = 0;
    events.length = 0;
    setLoadingShown(false);
    setUserId(null);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("boot shows the loading page without a fade", async () => {
    renderPages();
    await flush();

    expect(pagesInDom()).toEqual(["pageLoading"]);
    expect(fades).toEqual([]);
    expect(document.body.querySelector("#pageLoading")?.className).toBe(
      "page pageLoading loadingClass",
    );
    expect(events).toEqual(["mount loading"]);
  });

  it("fades the old page out completely before the new page goes in", async () => {
    renderPages("settings");
    await flush();
    events.length = 0;

    setActivePage("about");
    await flush();
    expect(pagesInDom()).toEqual(["pageSettings"]);
    expect(fades.map((f) => [f.el.id, f.opacity])).toEqual([
      ["pageSettings", 0],
    ]);

    await finishFade();
    expect(pagesInDom()).toEqual(["pageAbout"]);
    expect(document.body.querySelector("#pageAbout")?.className).toBe(
      "page pageAbout full-width",
    );
    expect(fades.map((f) => [f.el.id, f.opacity])).toEqual([["pageAbout", 1]]);

    await finishFade();
    expect(pagesInDom()).toEqual(["pageAbout"]);
    expect(fades).toEqual([]);
    expect(
      document.body.querySelector<HTMLElement>("#pageAbout")?.style.opacity,
    ).toBe("");
  });

  it("goes old -> loading -> new when loading is shown", async () => {
    renderPages("settings");
    await flush();
    const seen = new Set<string>();
    const record = (): void => {
      expect(pagesInDom().length).toBeLessThanOrEqual(1);
      pagesInDom().forEach((id) => seen.add(id));
    };

    setLoadingShown(true);
    record();
    for (let i = 0; i < 2; i++) {
      await finishFade();
      record();
    }
    expect(pagesInDom()).toEqual(["pageLoading"]);

    batch(() => {
      setActivePage("about");
      setLoadingShown(false);
    });
    for (let i = 0; i < 2; i++) {
      await finishFade();
      record();
    }

    expect(pagesInDom()).toEqual(["pageAbout"]);
    expect([...seen]).toEqual(["pageSettings", "pageLoading", "pageAbout"]);
  });

  it("keeps the loading page when loading is shown while it is already shown", async () => {
    renderPages();
    await flush();
    const loadingEl = document.body.querySelector("#pageLoading");

    setLoadingShown(true);
    await flush();

    expect(fades).toEqual([]);
    expect(document.body.querySelector("#pageLoading")).toBe(loadingEl);

    batch(() => {
      setActivePage("test");
      setLoadingShown(false);
    });
    await flush();
    expect(fades.map((f) => [f.el.id, f.opacity])).toEqual([
      ["pageLoading", 0],
    ]);
    await finishPageChange();
    expect(pagesInDom()).toEqual(["pageTest"]);
    expect(
      document.body.querySelector("#pageTest")?.hasAttribute("data-nosnippet"),
    ).toBe(true);
  });

  it("mounts page content only once its wrapper is attached", async () => {
    renderPages("settings");
    await flush();
    events.length = 0;

    setActivePage("about");
    await finishFade();

    expect(events).toEqual(["cleanup settings", "mount about"]);
  });

  it("removes a page leaving before its fade in started, cleaning up its content", async () => {
    renderPages("settings");
    await flush();
    events.length = 0;

    setActivePage("about");
    fades[0]?.complete();
    await settleMicrotasks();
    // about is inserted, its fade in waits for the next frame
    expect(pagesInDom()).toEqual(["pageAbout"]);

    setActivePage("login");
    expect(pagesInDom()).toEqual(["pageLogin"]);
    await flush();
    expect(fades.map((f) => [f.el.id, f.opacity])).toEqual([["pageLogin", 1]]);
    expect(events).not.toContain("mount about");
    expect(events).toContain("mount login");
  });

  it("resolves the shown page promise once the new page is fully in", async () => {
    renderPages("settings");
    await flush();
    await expect(waitForShownPage()).resolves.toBeUndefined();

    setActivePage("about");
    let resolved = false;
    void waitForShownPage().then(() => (resolved = true));

    await finishFade();
    expect(resolved).toBe(false);

    await finishFade();
    expect(resolved).toBe(true);
  });

  it("renders an empty wrapper for a page needing authentication when signed out", async () => {
    renderPages("account");
    await flush();

    expect(pagesInDom()).toEqual(["pageAccount"]);
    expect(document.body.querySelector("#pageAccount")).toBeEmptyDOMElement();
    expect(events).toEqual([]);

    setUserId("uid");
    await flush();
    expect(events).toEqual(["mount account"]);
  });
});
