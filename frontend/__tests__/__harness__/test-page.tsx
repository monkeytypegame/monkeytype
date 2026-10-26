/**
 * Test-page harness: the real TestPage and test engine in jsdom, typed into
 * through the words input like a browser does. The main seam for test page
 * behaviour: render, type, advance frames, check what's on screen.
 *
 * Name specs using it `*.page-spec.tsx`: they run in the `test-page` vitest
 * project, which has no global DOM query mocks (the engine's vanilla modules
 * query the real DOM). Loaded in another project, it throws.
 *
 * ```tsx
 * afterEach(async () => cleanupTestPage());
 *
 * it("marks a typo", async () => {
 *   const page = await renderTestPage({ words: ["the", "fox"] });
 *   await page.type("tx");
 *   expect(page.word(0).letters()).toEqual([
 *     { char: "t", state: "correct" },
 *     { char: "h", state: "incorrect" },
 *     { char: "e", state: "untyped" },
 *   ]);
 *   expect(page.phase()).toBe("active");
 * });
 * ```
 *
 * - `words`: the test shows exactly these words, in order (a custom test).
 *   Without it the words come from english.json (read from disk), random.
 *   `config` overrides the default config, eg. `{ mode: "time", time: 15 }`.
 * - Fake timers (setTimeout, setInterval, Date, performance and animation
 *   frames) for the whole spec file, from before anything loads. Animejs is
 *   real: the test timer and fades run on its rAF loop, so they move with the
 *   fake clock. `frame()` runs one
 *   animation frame, `advance(ms)` moves the clock (live stats tick, timed
 *   tests end). `renderTestPage` resolves once the first test is ready.
 * - `type(text)` types through the words input (keydown, beforeinput, input,
 *   keyup per char; "\b" is backspace, "\n" Enter), `compose(updates)` like
 *   an IME. Both end with a frame, so the words are rendered: pass
 *   `{ flush: false }` to check before it (input never renders synchronously).
 * - Reading: `word(i).letters()` / `word(i).state`, `phase()`, `liveStats()`.
 *   Their states are semantic, not css classes, so specs survive markup
 *   changes.
 * - Mocked: firebase (signed out, so a finished test isn't saved), the theme
 *   controller (indexedDB), the chart (canvas). Stubbed in jsdom: matchMedia
 *   (nothing matches), scrolling. The engine's debug logs are muted.
 * - The page mounts in a router with only the test page, so it reads as the
 *   test page (typing starts a test only there) and the result's links work.
 */
// static json (layouts, languages) read from disk
import "./mock-static";
import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";

import { cleanup, render } from "@solidjs/testing-library";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RegisteredRouter,
  RouterProvider,
} from "@tanstack/solid-router";
import { vi } from "vitest";

import { TestPage } from "../../src/ts/components/pages/test/TestPage";
import { __testing as configTesting } from "../../src/ts/config/testing";
import { compose, typeText } from "../../src/ts/dev/typing-driver";
import { setRouter } from "../../src/ts/router/instance";
import {
  currentLiveStats,
  isTestActive,
  isResultCalculating,
  isTestFinished,
  isTestRestarting,
} from "../../src/ts/states/test";
import * as CustomText from "../../src/ts/test/custom-text";

// fake timers, then jsdom gaps: matchMedia (ad controller, on import; no
// query matches) and scrolling (the test keeps itself in view)
vi.hoisted(() => {
  // mock-dom's querySelector returns a detached div
  if (document.querySelector("body") !== document.body) {
    throw new Error(
      "The test-page harness needs the real DOM: name the spec *.page-spec.tsx",
    );
  }
  // before any import: animejs keeps the Date.now and requestAnimationFrame
  // it finds on import. Kept for the whole spec file, so it never loses them
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "Date",
      "performance",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ],
  });
  Element.prototype.scrollIntoView = () => undefined;
  window.scrollTo = () => undefined;
  // the engine logs every event and word at debug level
  console.debug = () => undefined;
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
});
vi.mock("../../src/ts/firebase", () => ({
  app: undefined,
  Auth: undefined,
  getAuthenticatedUser: () => null,
  isAuthAvailable: () => false,
}));
// no canvas in jsdom; the result chart renders nothing
vi.mock("../../src/ts/components/common/ChartJs", () => ({
  ChartJs: () => null,
}));
// opens indexedDB on import
vi.mock("../../src/ts/controllers/theme-controller", () => ({
  randomizeTheme: vi.fn(),
}));

export type TestPhase = "ready" | "active" | "finished";

export type LetterState =
  | "untyped"
  | "correct"
  | "incorrect"
  | "extra"
  | "dead"
  | "deadCorrect";

export type WordState = "active" | "typed" | "error" | "upcoming";

export type RenderTestPageOptions = {
  /** The test shows exactly these words, in order (a custom test). */
  words?: string[];
  config?: Partial<ConfigSchema>;
};

export type TestPageHarness = {
  /** Types `text`; "\b" is backspace, "\n" Enter. Ends with a frame. */
  type: (text: string, options?: { flush?: boolean }) => Promise<void>;
  /** IME composition: each update is the composition so far, the last commits. */
  compose: (updates: string[], options?: { flush?: boolean }) => Promise<void>;
  /** Runs one animation frame. */
  frame: () => Promise<void>;
  /** Moves the clock by `ms`, running timers and frames on the way. */
  advance: (ms: number) => Promise<void>;
  word: (index: number) => {
    letters: () => { char: string; state: LetterState }[];
    state: WordState;
  };
  phase: () => TestPhase;
  liveStats: () => {
    wpm?: number;
    raw?: number;
    acc?: number;
    seconds?: number;
  };
};

function letterState(letter: Element): LetterState {
  const has = (name: string): boolean => letter.classList.contains(name);
  if (has("dead")) return has("correct") ? "deadCorrect" : "dead";
  if (has("extra")) return "extra";
  if (has("incorrect")) return "incorrect";
  if (has("correct")) return "correct";
  return "untyped";
}

function wordState(word: Element): WordState {
  const has = (name: string): boolean => word.classList.contains(name);
  if (has("active")) return "active";
  if (has("error")) return "error";
  if (has("typed")) return "typed";
  return "upcoming";
}

async function frame(): Promise<void> {
  vi.advanceTimersToNextFrame();
  // let the frame's promise chains run
  await vi.advanceTimersByTimeAsync(0);
}

/** Mounts the test page and resolves once its first test is ready. */
export async function renderTestPage(
  options: RenderTestPageOptions = {},
): Promise<TestPageHarness> {
  if (options.words !== undefined) {
    // as the custom text modal's simple mode
    CustomText.setMode("repeat");
    CustomText.setPipeDelimiter(false);
    CustomText.setText(options.words);
    CustomText.setLimitMode("word");
    CustomText.setLimitValue(options.words.length);
  }
  configTesting.replaceConfig({
    ...(options.words !== undefined ? { mode: "custom" } : {}),
    ...options.config,
  });

  const root = createRootRoute();
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: "/",
        staticData: { page: "test" },
        component: TestPage,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  setRouter(router as unknown as RegisteredRouter);
  await router.load();
  const { container } = render(() => <RouterProvider router={router} />);

  // the restart on mount: fade out, generate words, fade in
  for (let i = 0; i < 50 && isTestRestarting(); i++) await frame();
  if (isTestRestarting()) throw new Error("The test page never got ready");
  await frame();

  const wordElement = (index: number): Element => {
    const el = container.querySelector(
      `#words .word[data-wordindex="${index}"]`,
    );
    if (el === null) throw new Error(`Word ${index} is not rendered`);
    return el;
  };

  return {
    async type(text, { flush = true } = {}) {
      await typeText(text);
      if (flush) await frame();
    },
    async compose(updates, { flush = true } = {}) {
      compose(updates);
      if (flush) await frame();
    },
    frame,
    async advance(ms) {
      await vi.advanceTimersByTimeAsync(ms);
    },
    word: (index) => ({
      letters: () =>
        [...wordElement(index).querySelectorAll(":scope > letter")].map(
          (letter) => ({
            char: letter.textContent ?? "",
            state: letterState(letter),
          }),
        ),
      get state() {
        return wordState(wordElement(index));
      },
    }),
    phase: () =>
      isTestFinished() ? "finished" : isTestActive() ? "active" : "ready",
    liveStats: () => ({
      wpm: currentLiveStats.wpm,
      raw: currentLiveStats.raw,
      acc: currentLiveStats.acc,
      seconds: currentLiveStats.seconds,
    }),
  };
}

/** Unmounts the page, ending its test. */
export async function cleanupTestPage(): Promise<void> {
  // a finishing test can't be stopped: let it finish
  for (let i = 0; i < 100 && isResultCalculating(); i++) await frame();
  cleanup();
  setRouter(undefined);
}
