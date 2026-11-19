import {
  createEffect,
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
import { getCustomTextIndicator } from "../../../states/core";
import { skipBreakdownEvent } from "../../../states/header";
import { listenForModifierKeys } from "../../../states/modifiers";
import { listenForMonkeyKeys } from "../../../states/monkey";
import { isResultShown } from "../../../states/result";
import {
  isFocusMode,
  getLayoutfluidTimerText,
  isLayoutfluidTimerVisible,
  isResultLoading,
  isResultScreen,
  isTestInitFailed,
  isTypingTestHidden,
  isWordsWrapperHidden,
  resetIncompleteTests,
  setRestartShowing,
  setResultLeaving,
  setTestFocusState,
} from "../../../states/test";
import * as CustomText from "../../../test/custom-text";
import {
  getRestartOptions,
  getTestId,
  getTestPhase,
  isTestActive,
} from "../../../test/engine/state";
import {
  leaveTestPage,
  onRestartButtonClick,
  restartTest,
  restartIfNotStarted,
  showRestartedTest,
} from "../../../test/test-logic";
import {
  focusWordsEvent,
  markTestPageMounted,
  registerFinishFadeOut,
} from "../../../test/test-page-bridge";
import { cn } from "../../../utils/cn";
import * as Misc from "../../../utils/misc";
import { canQuickRestart } from "../../../utils/quick-restart";
import { Button } from "../../common/Button";
import { LoadingCircle } from "../../common/LoadingCircle";
import { CapsWarning } from "./CapsWarning";
import { CompositionDisplay } from "./CompositionDisplay";
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
      if (isTestActive() || isResultScreen()) return;
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
  // T6c: the finish fade-out follows the phase here
  onCleanup(
    registerFinishFadeOut(async (duration) => {
      if (typingTestRef === undefined) return;
      await Misc.promiseAnimate(typingTestRef, { opacity: 0, duration });
    }),
  );

  // Restart display: the engine generates at once; this fades out what's on
  // screen, then swaps the new test in (hidden) once the restart committed,
  // and fades it in. A restart during the fade-out shows only its own result.
  let display: "idle" | "out" | "waiting" | "in" = "idle";
  let source: "testPage" | "resultPage" = "testPage";

  const fadeOutForRestart = async (): Promise<void> => {
    display = "out";
    setRestartShowing(true);
    const { noAnim } = untrack(getRestartOptions);
    // what's rendered: the phase is already "restarting"
    source = untrack(isResultShown) ? "resultPage" : "testPage";
    if (source === "resultPage") setResultLeaving(true);
    await fade(
      source === "resultPage" ? resultRef : typingTestRef,
      "out",
      noAnim,
    );
    setResultLeaving(false);
    display = "waiting";
    void swapInRestartedTest();
  };

  const swapInRestartedTest = async (): Promise<void> => {
    if (display !== "waiting" || untrack(getTestPhase) === "restarting") {
      return;
    }
    display = "in";
    // init gave up: TestInitFailed shows instead
    if (!untrack(isTestInitFailed)) {
      showRestartedTest();
      // while hidden: focusing restarts the caret's blink. Input waits for
      // the fade-in (isRestartShowing)
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
    setRestartShowing(false);
  };

  createEffect(
    on(getTestPhase, (phase) => {
      if (phase !== "restarting") return;
      // already fading out or waiting: it shows the latest restart
      if (display === "out" || display === "waiting") return;
      void fadeOutForRestart();
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
    setRestartShowing(false);
    setResultLeaving(false);
  });

  // WordsInput takes the focus; during a test Words keeps the active line in
  // view
  focusWordsEvent.useListener(() => {
    if (isTestActive()) return;
    Misc.scrollToCenterOrTop(typingTestRef ?? null);
  });

  createEffect(
    on(
      isResultScreen,
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
          hidden: isTestInitFailed() || isTypingTestHidden(),
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
      <Show when={isResultLoading()}>
        <div class="animate-[fadeIn_0.125s_ease_0.5s_forwards] text-center text-[2rem] opacity-0">
          <LoadingCircle />
        </div>
      </Show>
      <Show when={isResultShown()}>
        <TestResult ref={(el) => (resultRef = el)} />
      </Show>
    </>
  );
}
