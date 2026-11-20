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
 *   frames) for the whole spec file, from before anything loads (the
 *   project's setup file, setup-test-page.ts, so import order can't matter). Animejs is
 *   real: the test timer and fades run on its rAF loop, so they move with the
 *   fake clock. `frame()` runs one
 *   animation frame, `advance(ms)` moves the clock (live stats tick, timed
 *   tests end). `renderTestPage` resolves once the first test is ready.
 * - `type(text)` types through the words input (keydown, beforeinput, input,
 *   keyup per char; "\b" is backspace, "\n" Enter), `compose(updates)` like
 *   an IME. Both end with a frame, so the words are rendered: pass
 *   `{ flush: false }` to check before it (input never renders synchronously).
 * - Reading: `word(i).letters()` / `word(i).state`, `phase()`, `liveStats()`,
 *   `caret()` / `paceCaret()` (shown, and the pace caret's target letter),
 *   `resultScreen()` (result or spinner). `holdResult()` makes the next
 *   result build wait for `releaseResult()`, as a slow one.
 *   Their states are semantic, not css classes, so specs survive markup
 *   changes.
 * - Mocked (also in setup-test-page.ts): firebase (signed out, so a finished test isn't saved), the theme
 *   controller (indexedDB), the chart and confetti (canvas). Stubbed in jsdom: matchMedia
 *   (nothing matches), scrolling. The engine's debug logs are muted.
 * - The page mounts in a router with only the test page, so it reads as the
 *   test page (typing starts a test only there) and the result's links work.
 */
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
import { createEffect, createRoot, on } from "solid-js";
import { vi } from "vitest";

import type { WordStatus } from "../../src/ts/components/pages/test/Word";
import type { LetterStatus } from "../../src/ts/components/pages/test/WordLetter";

import { TestPage } from "../../src/ts/components/pages/test/TestPage";
import { applyConfig } from "../../src/ts/config/lifecycle";
import { setConfig } from "../../src/ts/config/setters";
import { __testing as configTesting } from "../../src/ts/config/testing";
import { compose, deleteWord, typeText } from "../../src/ts/dev/typing-driver";
import { setRouter } from "../../src/ts/router/instance";
import { isRestartAnimating, isTestFadedOut } from "../../src/ts/states/test";
import * as CustomText from "../../src/ts/test/custom-text";
import {
  isResultPending,
  isTestActive,
  isTestRestarting,
  liveStats,
  isTestFinished,
} from "../../src/ts/test/engine/state";
import { getTestSettings } from "../../src/ts/test/engine/test-settings";
import { paceCaretTarget } from "../../src/ts/test/pace-caret";
import { restartTest } from "../../src/ts/test/test-logic";
import { resultBuild } from "./result-build";

// tests check the rendered DOM itself, not the registry's refs, so they
// query letters directly (spec Q33 exempts tests)
const LETTER_SELECTOR = '[data-ui-element="letter"]';

// a spec in another project (no setup-test-page, mock-dom's querySelector
// returns a detached div)
vi.hoisted(() => {
  if (document.querySelector("body") !== document.body) {
    throw new Error(
      "The test-page harness needs the real DOM: name the spec *.page-spec.tsx",
    );
  }
});

export type PagePhase = "ready" | "active" | "finished" | "restarting";

export type RenderTestPageOptions = {
  /** The test shows exactly these words, in order (a custom test). */
  words?: string[];
  config?: Partial<ConfigSchema>;
};

export type TestPageHarness = {
  /** Types `text`; "\b" is backspace, "\n" Enter. Ends with a frame. */
  type: (text: string, options?: { flush?: boolean }) => Promise<void>;
  /** Ctrl/Alt+Backspace. Ends with a frame. */
  deleteWord: (options?: { flush?: boolean }) => Promise<void>;
  /** IME composition: each update is the composition so far, the last commits. */
  compose: (updates: string[], options?: { flush?: boolean }) => Promise<void>;
  /** Runs one animation frame. */
  frame: () => Promise<void>;
  /** Moves the clock by `ms`, running timers and frames on the way. */
  advance: (ms: number) => Promise<void>;
  word: (index: number) => {
    letters: () => { char: string; state: LetterStatus }[];
    state: WordStatus;
    isActive: boolean;
  };
  phase: () => PagePhase;
  /** Restarts begun since the page got ready. */
  getRestartCount: () => number;
  /** Requests a restart, as the restart button. */
  restart: () => void;
  /** Sets a config key, as the settings UI. */
  setConfig: typeof setConfig;
  /** Applies a whole config in one batch, as a preset. */
  applyConfig: typeof applyConfig;
  /** The settings the current test was generated with. */
  testSettings: typeof getTestSettings;
  caret: () => { shown: boolean };
  paceCaret: () => {
    shown: boolean;
    /** the letter it's heading for */
    target?: { wordIndex: number; letterIndex: number };
  };
  liveStats: () => {
    wpm?: number;
    raw?: number;
    acc?: number;
    seconds?: number;
  };
  /** What the result screen shows: the result, or the spinner meanwhile. */
  resultScreen: () => { result: boolean; spinner: boolean };
  /** The test has faded out on finish (the ads show), until a restart swaps the new one in. */
  isTestFadedOut: () => boolean;
  /** Holds the next result build (as a slow one) until releaseResult(). */
  holdResult: () => void;
  releaseResult: () => void;
};

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

  let sawRestart = false;
  const stopWatchingRestart = createRoot((dispose) => {
    createEffect(() => {
      if (isTestRestarting()) sawRestart = true;
    });
    return dispose;
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

  // the restart on mount: fade out, generate words, fade in. It may only
  // begin a frame in, after a previous spec's finished test
  const ready = (): boolean =>
    sawRestart && !isTestRestarting() && !isRestartAnimating();
  for (let i = 0; i < 50 && !ready(); i++) await frame();
  stopWatchingRestart();
  if (!ready()) throw new Error("The test page never got ready");
  // the live stats and the render flush on the next frame
  await frame();

  let restarts = 0;
  stopCountingRestarts?.();
  stopCountingRestarts = createRoot((dispose) => {
    createEffect(
      on(
        isTestRestarting,
        (restarting) => {
          if (restarting) restarts++;
        },
        { defer: true },
      ),
    );
    return dispose;
  });

  const wordElement = (index: number): Element => {
    const el = container.querySelector(
      `#words [data-ui-element="word"][data-wordindex="${index}"]`,
    );
    if (el === null) throw new Error(`Word ${index} is not rendered`);
    return el;
  };

  const isShown = (uiElement: string): boolean => {
    const el = container.querySelector(`[data-ui-element="${uiElement}"]`);
    if (el === null) throw new Error(`No ${uiElement} rendered`);
    return !el.classList.contains("hidden");
  };

  return {
    async type(text, { flush = true } = {}) {
      await typeText(text);
      if (flush) await frame();
    },
    async deleteWord({ flush = true } = {}) {
      deleteWord();
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
        [
          ...wordElement(index).querySelectorAll<HTMLElement>(
            `:scope > ${LETTER_SELECTOR}`,
          ),
        ].map((letter) => ({
          char: letter.textContent ?? "",
          state: letter.dataset["uiState"] as LetterStatus,
        })),
      get state() {
        return (wordElement(index) as HTMLElement).dataset[
          "uiState"
        ] as WordStatus;
      },
      get isActive() {
        return wordElement(index).hasAttribute("data-ui-active");
      },
    }),
    phase: () =>
      isTestFinished()
        ? "finished"
        : isTestActive()
          ? "active"
          : isTestRestarting()
            ? "restarting"
            : "ready",
    getRestartCount: () => restarts,
    restart: () => void restartTest(),
    setConfig,
    applyConfig,
    testSettings: getTestSettings,
    caret: () => ({ shown: isShown("caret") }),
    paceCaret: () => {
      const target = paceCaretTarget();
      return {
        shown: isShown("paceCaret"),
        ...(target !== undefined && {
          target: {
            wordIndex: target.wordIndex,
            letterIndex: target.letterIndex,
          },
        }),
      };
    },
    liveStats: () => ({
      wpm: liveStats.wpm,
      raw: liveStats.raw,
      acc: liveStats.acc,
      seconds: liveStats.seconds,
    }),
    isTestFadedOut,
    resultScreen: () => ({
      result: container.querySelector("#result") !== null,
      spinner:
        container.querySelector('[data-ui-element="resultSpinner"]') !== null,
    }),
    holdResult: () => {
      resultBuild.held = true;
    },
    releaseResult,
  };
}

let stopCountingRestarts: (() => void) | undefined;

function releaseResult(): void {
  resultBuild.held = false;
  for (const fn of resultBuild.waiting.splice(0)) fn();
}

/** Unmounts the page, ending its test. */
export async function cleanupTestPage(): Promise<void> {
  releaseResult();
  stopCountingRestarts?.();
  stopCountingRestarts = undefined;
  // a finishing test can't be stopped: let it build its result
  for (let i = 0; i < 100 && isResultPending(); i++) await frame();
  cleanup();
  setRouter(undefined);
}
