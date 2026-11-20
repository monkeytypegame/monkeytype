import {
  createEffect,
  createSignal,
  JSXElement,
  on,
  onCleanup,
  onMount,
  Show,
  untrack,
} from "solid-js";
import { debounce } from "throttle-debounce";

import { Config, getConfig } from "../../../config/store";
import * as AdController from "../../../controllers/ad-controller";
import * as SoundController from "../../../controllers/sound-controller";
import * as ThemeController from "../../../controllers/theme-controller";
import * as MonkeyPower from "../../../elements/monkey-power";
import { blurInputElement } from "../../../input/input-element";
import { isOnline, showOfflineBanner } from "../../../states/connection";
import { getCustomTextIndicator } from "../../../states/core";
import { getGlarsesMode } from "../../../states/glarses-mode";
import { skipBreakdownEvent } from "../../../states/header";
import { listenForModifierKeys } from "../../../states/modifiers";
import { listenForMonkeyKeys } from "../../../states/monkey";
import {
  isFocusMode,
  getLayoutfluidTimerText,
  isLayoutfluidTimerVisible,
  isTestInitFailed,
  isWordsWrapperHidden,
  resetIncompleteTests,
  setFocusMode,
  setLayoutfluidTimerVisible,
  setRestartAnimating,
  setWordsInputPosition,
  setTestFocusState,
  setTestFadedOut,
} from "../../../states/test";
import { replaceWords, resetWordsRender } from "../../../states/words-render";
import * as CustomText from "../../../test/custom-text";
import {
  getActiveWordIndex,
  getRestartOptions,
  getTestId,
  getResultData,
  isTestRestarting,
  isTestActive,
  isTestFinished,
} from "../../../test/engine/state";
import { getTestSettings } from "../../../test/engine/test-settings";
import * as TestWords from "../../../test/engine/test-words";
import * as Funbox from "../../../test/funbox/funbox";
import {
  leaveTestPage,
  onRestartButtonClick,
  restartTest,
} from "../../../test/test-logic";
import { markTestPageMounted } from "../../../test/test-page-bridge";
import {
  closeResultWords,
  toggleResultWords,
} from "../../../test/words-history";
import { cn } from "../../../utils/cn";
import * as Misc from "../../../utils/misc";
import { canQuickRestart } from "../../../utils/quick-restart";
import { Button } from "../../common/Button";
import { LoadingCircle } from "../../common/LoadingCircle";
import { CapsWarning } from "./CapsWarning";
import { CompositionDisplay } from "./CompositionDisplay";
import { focusWordsEvent } from "./focus-words";
import { FunboxTimer } from "./FunboxTimer";
import { Keymap } from "./Keymap";
import { LiveStatsMini } from "./live-stats/LiveStatsMini";
import { LiveStatsTextBottom } from "./live-stats/LiveStatsTextBottom";
import { LiveStatsTextTop } from "./live-stats/LiveStatsTextTop";
import { MemoryFunboxTimer } from "./MemoryFunboxTimer";
import { TestModesNotice } from "./modes-notice/TestModesNotice";
import { Monkey } from "./Monkey";
import { OutOfFocusWarning } from "./OutOfFocusWarning";
import { Premid } from "./Premid";
import * as Replay from "./result/replay";
import * as ResultWordHighlight from "./result/result-word-highlight";
import { TestResult } from "./result/TestResult";
import { TestConfig } from "./TestConfig";
import { TestInitFailed } from "./TestInitFailed";
import { Words, wordsModeClasses } from "./Words";
import { WordsInput } from "./WordsInput";

/**
 * The test page. Internals are still vanilla - this owns the markup and hands
 * its elements to the vanilla modules on mount, unbinding them on cleanup.
 * Mounting starts a fresh test.
 */
export function TestPage(): JSXElement {
  // the router ends the test as soon as a navigation away starts (see
  // createAppRouter). This also ends it when the page unmounts without one,
  // eg. the loading page covering it while user data downloads after sign in
  onCleanup(leaveTestPage);

  let typingTestRef: HTMLDivElement | undefined;
  let wordsWrapperRef: HTMLDivElement | undefined;
  let resultRef: HTMLDivElement | undefined;

  onMount(() => {
    // registered first so a throw below still cleans up
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    const { signal } = controller;

    if (typingTestRef === undefined) {
      throw new Error("TestPage refs not set");
    }

    markTestPageMounted(signal);
    listenForModifierKeys(signal);
    listenForMonkeyKeys(signal);
    // any previously rendered words are gone, start a fresh test
    void restartTest({ noAnim: true });

    resetIncompleteTests();

    window.addEventListener(
      "blur",
      () => setTestFocusState("unfocusedWindow"),
      { signal },
    );
    window.addEventListener("focus", restartIfNotStarted, { signal });
    // confirm leaving mid test, unless it's quick to redo
    window.addEventListener(
      "beforeunload",
      (event) => {
        if (!isTestActive()) return;
        if (
          canQuickRestart(
            Config.mode,
            Config.words,
            Config.time,
            CustomText.getData(),
            getCustomTextIndicator()?.isLong ?? false,
          )
        ) {
          return;
        }
        event.preventDefault();
        // Included for legacy support, e.g. Chrome/Edge < 119
        // oxlint-disable-next-line no-deprecated
        event.returnValue = "";
      },
      { signal },
    );
    // before the test, keeps it in view. During one, Words keeps the active
    // line in view
    const keepTestInView = debounce(250, () => {
      if (isTestActive() || isTestFinished()) return;
      Misc.scrollToCenterOrTop(typingTestRef ?? null);
    });
    window.addEventListener("resize", keepTestInView, { signal });
    signal.addEventListener("abort", () => keepTestInView.cancel());
    // little roadblock for basic cheating
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "hidden") {
          setTestFocusState("unfocusedWindow");
        } else {
          restartIfNotStarted();
        }
      },
      { signal },
    );
  });

  /** Resolves when the animation ends, or at once without the element. */
  const fade = async (
    el: HTMLElement | undefined,
    direction: "in" | "out",
    noAnim: boolean,
  ): Promise<void> => {
    if (el === undefined) return;
    // synchronous, so the shown test can't paint before the fade starts
    if (direction === "in") el.style.opacity = "0";
    await Misc.promiseAnimate(el, {
      opacity: direction === "in" ? [0, 1] : 0,
      duration: noAnim ? 0 : Misc.applyReducedMotion(125),
    });
  };
  // Finish display: on finish the words fade out, then the result fades in.
  // Rendering the result runs on the main thread: a spinner painted first
  // (CSS, shown after a delay) keeps animating while it's slow. The engine
  // has built the result during the fade-out; if not, the spinner waits for it.
  let finishDisplay: "idle" | "out" | "spinner" | "waiting" = "idle";
  // what's shown: the test, the spinner (from the words' fade-out until the
  // result renders) or the result
  const [getDisplay, setDisplay] = createSignal<"test" | "spinner" | "result">(
    "test",
  );
  // the ads follow it (isTestFadedOut): set together, before the ad
  // controller renders the result's ads
  const showDisplay = (display: "test" | "spinner" | "result"): void => {
    setDisplay(display);
    setTestFadedOut(display !== "test");
  };
  const isSpinnerShown = (): boolean => getDisplay() === "spinner";
  const isTestShown = (): boolean => getDisplay() === "test";
  const isResultShown = (): boolean => getDisplay() === "result";

  const fadeOutForFinish = async (): Promise<void> => {
    finishDisplay = "out";
    await fade(typingTestRef, "out", false);
    if (finishDisplay !== "out" || !isStillFinished()) return;
    finishDisplay = "spinner";
    showDisplay("spinner");
    // after the spinner is painted
    await new Promise((resolve) =>
      requestAnimationFrame(() => setTimeout(resolve, 0)),
    );
    if (finishDisplay !== "spinner" || !isStillFinished()) return;
    finishDisplay = "waiting";
    await showResultWhenBuilt();
  };

  const showResultWhenBuilt = async (): Promise<void> => {
    if (finishDisplay !== "waiting" || untrack(getResultData) === null) return;
    finishDisplay = "idle";
    showResult();
    await fade(resultRef, "in", false);
  };

  /** False once a restart began: it shows the new test instead. */
  const isStillFinished = (): boolean => {
    if (untrack(isTestFinished)) return true;
    finishDisplay = "idle";
    return false;
  };

  /** Shows the result while it's still transparent. */
  const showResult = (): void => {
    closeResultWords();
    Replay.resetReplay();
    if (!isOnline()) showOfflineBanner();
    setFocusMode(false);
    if (
      Config.alwaysShowWordsHistory &&
      canQuickRestart(
        getTestSettings().mode,
        getTestSettings().words,
        getTestSettings().time,
        getTestSettings().customText,
        getCustomTextIndicator()?.isLong ?? false,
      ) &&
      !getGlarsesMode()
    ) {
      toggleResultWords(true);
    }
    void Funbox.clear();
    // fade sets the opacity before the result can paint
    showDisplay("result");
    // the test's input lets go of the focus
    blurInputElement();
    void AdController.renderResult();
    // the result is shown: free the test words DOM
    resetWordsRender();
  };

  /**
   * Shows the restarted test while hidden. Outside effects and batches:
   * replaceWords measures the new words as they render.
   */
  const showNewTest = (): void => {
    showDisplay("test");
    setWordsInputPosition((position) => ({ ...position, left: 0 }));
    setFocusMode(false);
    setLayoutfluidTimerVisible(false);
    if (!isOnline()) showOfflineBanner();
    const zen = getTestSettings().mode === "zen";
    replaceWords(zen ? [{ display: "" }] : TestWords.words.get(), {
      activeWordIndex: getActiveWordIndex(),
      zen,
    });
  };

  /**
   * Little roadblock for basic cheating: restarts an unstarted test when the
   * window regains focus or becomes visible.
   */
  const restartIfNotStarted = (): void => {
    if (
      !isTestActive() &&
      !isTestFinished() &&
      (getTestSettings().mode === "time" || getTestSettings().mode === "words")
    ) {
      void restartTest({ noAnim: true });
    }
  };

  // Restart display: the engine generates at once; this fades out what's on
  // screen, then swaps the new test in (hidden) once the restart committed,
  // and fades it in. A restart during the fade-out shows only its own result.
  let display: "idle" | "out" | "waiting" | "in" = "idle";
  let source: "testPage" | "resultPage" = "testPage";

  const fadeOutForRestart = async (): Promise<void> => {
    display = "out";
    setRestartAnimating(true);
    const { noAnim } = untrack(getRestartOptions);
    // what's rendered: the phase is already "restarting"
    source = untrack(isResultShown) ? "resultPage" : "testPage";
    await fade(
      source === "resultPage" ? resultRef : typingTestRef,
      "out",
      noAnim,
    );
    display = "waiting";
    void swapInRestartedTest();
  };

  const swapInRestartedTest = async (): Promise<void> => {
    if (display !== "waiting" || untrack(isTestRestarting)) {
      return;
    }
    display = "in";
    // init gave up: TestInitFailed shows instead
    if (!untrack(isTestInitFailed)) {
      showNewTest();
      // while hidden: focusing restarts the caret's blink. Input waits for
      // the fade-in (isRestartAnimating)
      focusWordsEvent.dispatch({ force: true });
      // the restart's side effects
      ResultWordHighlight.destroy();
      if (source === "resultPage") {
        if (Config.randomTheme !== "off") {
          void ThemeController.randomizeTheme();
        }
        skipBreakdownEvent.dispatch();
      }
      AdController.destroyResult();
      void SoundController.clearAllSounds();
      MonkeyPower.reset();
    }
    // fade hides the test synchronously, before the new words paint
    await fade(typingTestRef, "in", untrack(getRestartOptions).noAnim);
    // a restart began meanwhile: it fades the test out again
    if (display !== "in") return;
    display = "idle";
    setRestartAnimating(false);
  };

  createEffect(
    on(isTestFinished, (finished, wasFinished) => {
      if (finished && wasFinished === false) void fadeOutForFinish();
    }),
  );
  createEffect(
    on(isTestRestarting, (restarting) => {
      if (!restarting) return;
      // already fading out or waiting: it shows the latest restart
      if (display === "out" || display === "waiting") return;
      void fadeOutForRestart();
    }),
  );
  // the result was built after the spinner showed: render it, outside the
  // effect (test-logic has set the result's own state by then)
  createEffect(
    on(getResultData, () => queueMicrotask(() => void showResultWhenBuilt()), {
      defer: true,
    }),
  );
  // the restart committed a new test
  createEffect(
    on(
      getTestId,
      // outside the effect and the commit's batch: replaceWords lays out the
      // new words as they render
      () => queueMicrotask(() => void swapInRestartedTest()),
      { defer: true },
    ),
  );
  onCleanup(() => {
    display = "idle";
    finishDisplay = "idle";
    setRestartAnimating(false);
    setTestFadedOut(false);
  });

  // WordsInput takes the focus; during a test Words keeps the active line in
  // view
  focusWordsEvent.useListener(() => {
    if (isTestActive()) return;
    Misc.scrollToCenterOrTop(typingTestRef ?? null);
  });

  createEffect(
    on(
      isTestFinished,
      (finished) => {
        if (finished && Config.playSoundOnClick === "16") {
          void SoundController.playFartReverb();
        }
      },
      { defer: true },
    ),
  );

  const isFullWidth = (): boolean =>
    getConfig.maxLineWidth === 0 || getConfig.tapeMode !== "off";
  const fontSize = (): string => `${getConfig.fontSize}rem`;

  return (
    <>
      <div class="full-width">
        <TestConfig />
      </div>

      <div
        id="typingTest"
        ref={(el) => (typingTestRef = el)}
        class={cn("content-grid", {
          content: getConfig.maxLineWidth === 0,
          "full-width-padding": getConfig.maxLineWidth !== 0,
          hidden: isTestInitFailed() || !isTestShown(),
        })}
        style={{
          "max-width": isFullWidth() ? "100%" : `${getConfig.maxLineWidth}ch`,
          "font-size": fontSize(),
        }}
      >
        <div>
          <CapsWarning />
        </div>
        <MemoryFunboxTimer />
        <FunboxTimer
          id="layoutfluidTimer"
          visible={isLayoutfluidTimerVisible()}
          text={getLayoutfluidTimerText()}
        />
        <div>
          <TestModesNotice />
        </div>

        <div>
          <LiveStatsTextTop />
        </div>
        <div class="full-width">
          <LiveStatsMini />
        </div>
        <div
          id="wordsWrapper"
          data-ui-element="wordsWrapper"
          ref={(el) => (wordsWrapperRef = el)}
          class={cn("content-grid full-width", wordsModeClasses(), {
            hidden: isWordsWrapperHidden(),
          })}
          translate="no"
          onClick={() => focusWordsEvent.dispatch({ force: false })}
        >
          <WordsInput />
          <div class="contents">
            <OutOfFocusWarning />
          </div>
          <Words wordsWrapperRef={() => wordsWrapperRef} />
        </div>

        <div>
          <CompositionDisplay />
        </div>
        <div>
          <Keymap />
        </div>
        <div>
          <Monkey />
        </div>

        <Button
          variant="text"
          dataset={{ "data-ui-element": "restartTestButton" }}
          class={cn(
            "mx-auto mt-4 w-max px-8 py-4 text-base transition-opacity",
            "focus:opacity-100 focus:transition-none",
            getConfig.quickRestart !== "off" && "hidden",
            "pointer-coarse:block", //always show the button if using a pointer-coarse device
            isFocusMode() && "opacity-0", //always hide if we are focused
          )}
          balloon={{
            text: "Restart Test",
            position: "down",
          }}
          fa={{
            icon: "fa-redo-alt",
            fixedWidth: true,
          }}
          onClick={onRestartButtonClick}
        />
        <div>
          <LiveStatsTextBottom />
        </div>
        <div>
          <Premid />
        </div>
      </div>
      <Show when={isTestInitFailed()}>
        <TestInitFailed />
      </Show>
      <Show when={isSpinnerShown()}>
        <div
          class="animate-[fadeIn_0.125s_ease_0.5s_forwards] text-center text-[2rem] opacity-0"
          data-ui-element="resultSpinner"
        >
          <LoadingCircle />
        </div>
      </Show>
      <Show when={isResultShown()}>
        <TestResult ref={(el) => (resultRef = el)} />
      </Show>
    </>
  );
}
