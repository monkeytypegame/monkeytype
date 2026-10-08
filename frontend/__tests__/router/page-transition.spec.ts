import { describe, expect, it } from "vitest";

import {
  getTargetPage,
  initialPageTransitionState,
  PageTransitionEvent,
  PageTransitionState,
  transitionPage,
} from "../../src/ts/router/page-transition";

function run(
  events: PageTransitionEvent[],
  from: PageTransitionState = initialPageTransitionState,
): PageTransitionState {
  return events.reduce(transitionPage, from);
}

const nav: PageTransitionEvent = {
  type: "navigationStarted",
  pathChanged: true,
};
const fade: PageTransitionEvent = { type: "fadeCompleted" };

/** Initial load straight onto the test page, fully faded in. */
const onTest = run([
  { type: "routeResolved", page: "test" },
  fade, // loading fades out
  fade, // test fades in
]);

describe("page transition", () => {
  it("starts on the loading page, transitioning", () => {
    expect(initialPageTransitionState).toMatchObject({
      mountedPage: "loading",
      fadePhase: "in",
      transitioning: true,
    });
  });

  it("loading page fading in doesn't end the initial load", () => {
    expect(run([fade]).transitioning).toBe(true);
  });

  it("initial load ends once the first page has faded in", () => {
    expect(onTest).toMatchObject({
      mountedPage: "test",
      fadePhase: "in",
      transitioning: false,
    });
  });

  it("keeps the old page mounted while it fades out", () => {
    const state = run([nav, { type: "routeResolved", page: "about" }], onTest);
    expect(state).toMatchObject({
      routePage: "about",
      mountedPage: "test",
      fadePhase: "out",
      transitioning: true,
    });
  });

  it("swaps the page after the fade out and ends after the fade in", () => {
    const swapped = run(
      [nav, { type: "routeResolved", page: "about" }, fade],
      onTest,
    );
    expect(swapped).toMatchObject({
      mountedPage: "about",
      fadePhase: "in",
      transitioning: true,
    });
    expect(run([fade], swapped).transitioning).toBe(false);
  });

  it("fades back in when navigating back before the fade out completes", () => {
    const state = run(
      [
        nav,
        { type: "routeResolved", page: "about" },
        nav,
        { type: "routeResolved", page: "test" },
      ],
      onTest,
    );
    expect(state).toMatchObject({ mountedPage: "test", fadePhase: "in" });
  });

  it("rapid navigation mounts the last page", () => {
    const state = run(
      [
        nav,
        { type: "routeResolved", page: "about" },
        nav,
        { type: "routeResolved", page: "settings" },
        fade,
      ],
      onTest,
    );
    expect(state.mountedPage).toBe("settings");
  });

  it("search param updates don't block input", () => {
    const state = run(
      [
        { type: "navigationStarted", pathChanged: false },
        { type: "routeResolved", page: "test" },
      ],
      onTest,
    );
    expect(state).toMatchObject({
      transitioning: false,
      mountedPage: "test",
      fadePhase: "in",
    });
  });

  it("same page path changes end once resolved (eg. /profile/a to /profile/b)", () => {
    const state = run([nav, { type: "routeResolved", page: "test" }], onTest);
    expect(state).toMatchObject({ transitioning: false, fadePhase: "in" });
  });

  it("search param updates during the fade in don't end the transition", () => {
    const fadingIn = run(
      [nav, { type: "routeResolved", page: "about" }, fade],
      onTest,
    );
    const state = run(
      [
        { type: "navigationStarted", pathChanged: false },
        { type: "routeResolved", page: "about" },
      ],
      fadingIn,
    );
    expect(state.transitioning).toBe(true);
    expect(run([fade], state).transitioning).toBe(false);
  });

  it("covers the route with the loading page while it loads", () => {
    const state = run([nav, { type: "loadingShown" }, fade], onTest);
    expect(getTargetPage(state)).toBe("loading");
    expect(state).toMatchObject({
      mountedPage: "loading",
      transitioning: true,
    });
    // the loading page fading in doesn't end it
    expect(run([fade], state).transitioning).toBe(true);
  });

  it("shows the page once the route has loaded", () => {
    const state = run(
      [
        nav,
        { type: "loadingShown" },
        fade,
        fade,
        { type: "routeResolved", page: "account" },
        fade,
        fade,
      ],
      onTest,
    );
    expect(state).toMatchObject({
      mountedPage: "account",
      transitioning: false,
    });
  });

  it("a failed load keeps the error up and ends the transition", () => {
    const state = run(
      [nav, { type: "loadingShown" }, fade, { type: "routeFailed" }],
      onTest,
    );
    expect(state).toMatchObject({
      loadingScreen: "error",
      routePage: "loading",
      mountedPage: "loading",
      transitioning: false,
    });
  });

  it("the next navigation clears the error", () => {
    const failed = run(
      [nav, { type: "loadingShown" }, fade, { type: "routeFailed" }],
      onTest,
    );
    const state = run([nav, { type: "routeResolved", page: "about" }], failed);
    expect(state).toMatchObject({
      loadingScreen: "hidden",
      fadePhase: "out",
      transitioning: true,
    });
    expect(run([fade, fade], state)).toMatchObject({
      mountedPage: "about",
      transitioning: false,
    });
  });
});
