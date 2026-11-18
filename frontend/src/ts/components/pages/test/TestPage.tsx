import {
  createEffect,
  JSXElement,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { debounce } from "throttle-debounce";

import { Config, getConfig } from "../../../config/store";
import * as AdController from "../../../controllers/ad-controller";
import * as SoundController from "../../../controllers/sound-controller";
import * as ThemeController from "../../../controllers/theme-controller";
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
  isTestActive,
  isTestFinished,
  isTestInitFailed,
  isTypingTestHidden,
  isWordsWrapperHidden,
  onFocusWordsRequest,
  requestFocusWords,
  resetIncompleteTests,
  setTestFocusState,
  testRestartedEvent,
} from "../../../states/test";
import * as CustomText from "../../../test/custom-text";
import {
  leaveTestPage,
  onRestartButtonClick,
  restartTest,
  restartIfNotStarted,
} from "../../../test/test-logic";
import {
  markTestPageMounted,
  registerFade,
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

  const unregisterFade = registerFade(
    "typingTest",
    async (direction, duration) => {
      if (typingTestRef === undefined) return;
      // synchronous, so the shown test can't paint before the fade starts
      if (direction === "in") typingTestRef.style.opacity = "0";
      await Misc.promiseAnimate(typingTestRef, {
        opacity: direction === "in" ? [0, 1] : 0,
        duration,
      });
    },
  );
  onCleanup(unregisterFade);

  // WordsInput takes the focus; during a test Words keeps the active line in
  // view
  onFocusWordsRequest(() => {
    if (isTestActive()) return;
    Misc.scrollToCenterOrTop(typingTestRef ?? null);
  });

  testRestartedEvent.useListener((source) => {
    ResultWordHighlight.destroy();
    if (source === "resultPage") {
      if (Config.randomTheme !== "off") {
        void ThemeController.randomizeTheme();
      }
      skipBreakdownEvent.dispatch();
    }
    AdController.destroyResult();
    void SoundController.clearAllSounds();
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
          onClick={() => requestFocusWords()}
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
        <TestResult />
      </Show>
    </>
  );
}
