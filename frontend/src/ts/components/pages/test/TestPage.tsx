import { JSXElement, onCleanup, onMount, Show } from "solid-js";
import { debounce } from "throttle-debounce";

import { Config, getConfig } from "../../../config/store";
import { getCustomTextIndicator } from "../../../states/core";
import { listenForModifierKeys } from "../../../states/modifiers";
import { listenForMonkeyKeys } from "../../../states/monkey";
import { isResultShown } from "../../../states/result";
import {
  getFocus,
  getLayoutfluidTimerText,
  isLayoutfluidTimerVisible,
  isResultLoading,
  isTestActive,
  isTestFinished,
  isTestInitFailed,
  isTypingTestHidden,
  isWordsWrapperHidden,
  resetIncompleteTests,
  setTestFocusState,
} from "../../../states/test";
import * as Caret from "../../../test/caret";
import * as CustomText from "../../../test/custom-text";
import * as Funbox from "../../../test/funbox/funbox";
import * as PaceCaret from "../../../test/pace-caret";
import {
  leaveTestPage,
  onRestartButtonClick,
  restartTest,
  restartIfNotStarted,
} from "../../../test/test-logic";
import * as TestUI from "../../../test/test-ui";
import { cn } from "../../../utils/cn";
import { ElementWithUtils } from "../../../utils/dom";
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
  let caretRef: HTMLDivElement | undefined;
  let paceCaretRef: HTMLDivElement | undefined;

  onMount(() => {
    // registered first so a throw below still cleans up
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    const { signal } = controller;

    if (
      typingTestRef === undefined ||
      wordsWrapperRef === undefined ||
      caretRef === undefined ||
      paceCaretRef === undefined
    ) {
      throw new Error("TestPage refs not set");
    }

    const wordsWrapper = new ElementWithUtils(wordsWrapperRef);
    Caret.initElement(
      { caret: new ElementWithUtils(caretRef), wordsWrapper },
      signal,
    );
    PaceCaret.initElement(
      { caret: new ElementWithUtils(paceCaretRef), wordsWrapper },
      signal,
    );

    TestUI.init(
      {
        typingTest: new ElementWithUtils(typingTestRef),
      },
      signal,
    );
    listenForModifierKeys(signal);
    listenForMonkeyKeys(signal);
    // any previously rendered words are gone, start a fresh test
    void restartTest({ noAnim: true });

    resetIncompleteTests();
    // registered last so it runs after the modules above have unbound
    signal.addEventListener("abort", () => {
      void Funbox.clear();
    });

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
          ref={(el) => (wordsWrapperRef = el)}
          class={cn("content-grid full-width", wordsModeClasses(), {
            hidden: isWordsWrapperHidden(),
          })}
          translate="no"
          onClick={() => {
            TestUI.focusWords();
          }}
        >
          <WordsInput />
          <div class="contents">
            <OutOfFocusWarning />
          </div>
          <div
            id="paceCaret"
            ref={(el) => (paceCaretRef = el)}
            class="full-width default hidden"
            style={{ "font-size": fontSize() }}
          ></div>
          <div
            id="caret"
            ref={(el) => (caretRef = el)}
            class="full-width default"
            style={{ "font-size": fontSize() }}
          ></div>
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
            getFocus() && "opacity-0", //always hide if we are focused
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
