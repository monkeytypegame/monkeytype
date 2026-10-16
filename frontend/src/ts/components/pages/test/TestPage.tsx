import { JSXElement, onCleanup, onMount, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { updateFooterAndVerticalAds } from "../../../controllers/ad-controller";
import {
  isInputElementFocused,
  registerInputElement,
} from "../../../input/input-element";
import { initInputListeners } from "../../../input/listeners";
import { listenForModifierKeys } from "../../../states/modifiers";
import { listenForMonkeyKeys } from "../../../states/monkey";
import { getShowResult } from "../../../states/result";
import {
  getFocus,
  getLayoutfluidTimerText,
  getResultVisible,
  isErrorBorderDisabled,
  isJoiningScript,
  isLanguageRightToLeft,
  isLayoutfluidTimerVisible,
  isReadAheadDisabled,
  isResultLoading,
  isTestInitFailed,
  isTypingTestHidden,
  isWordsHidden,
  isWordsWrapperHidden,
  resetIncompleteTests,
  setTestFocusState,
  showOutOfFocusWarning,
} from "../../../states/test";
import * as Caret from "../../../test/caret";
import * as Funbox from "../../../test/funbox/funbox";
import * as PaceCaret from "../../../test/pace-caret";
import {
  leaveTestPage,
  onRestartButtonClick,
  restart,
  restartIfNotStarted,
} from "../../../test/test-logic";
import * as TestUI from "../../../test/test-ui";
import { cn } from "../../../utils/cn";
import { ElementWithUtils } from "../../../utils/dom";
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

function prefixedClass(
  prefix: string,
  value: string | null,
): Record<string, boolean> {
  if (value === null) return {};
  return { [`${prefix}-${value.replaceAll("_", "-")}`]: true };
}

/**
 * The test page. Internals are still vanilla - this owns the markup and hands
 * its elements to the vanilla modules on mount, unbinding them on cleanup.
 * Mounting starts a fresh test.
 */
export function TestPage(): JSXElement {
  // page-controller ends the test as soon as a navigation away starts. This
  // also ends it when the page unmounts without one
  onCleanup(leaveTestPage);

  let typingTestRef: HTMLDivElement | undefined;
  let wordsWrapperRef: HTMLDivElement | undefined;
  let wordsRef: HTMLDivElement | undefined;
  let caretRef: HTMLDivElement | undefined;
  let paceCaretRef: HTMLDivElement | undefined;
  let inputRef: HTMLTextAreaElement | undefined;

  onMount(() => {
    // registered first so a throw below still cleans up
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    const { signal } = controller;

    if (
      typingTestRef === undefined ||
      wordsWrapperRef === undefined ||
      wordsRef === undefined ||
      caretRef === undefined ||
      paceCaretRef === undefined ||
      inputRef === undefined
    ) {
      throw new Error("TestPage refs not set");
    }

    // input first - the listeners and test-ui read it via getInputElement()
    registerInputElement(inputRef, signal);

    const words = new ElementWithUtils(wordsRef);
    const wordsWrapper = new ElementWithUtils(wordsWrapperRef);
    Caret.initElement(
      { caret: new ElementWithUtils(caretRef), words, wordsWrapper },
      signal,
    );
    PaceCaret.initElement(
      { caret: new ElementWithUtils(paceCaretRef), words, wordsWrapper },
      signal,
    );

    initInputListeners(signal);
    TestUI.init(
      { words, wordsWrapper, typingTest: new ElementWithUtils(typingTestRef) },
      signal,
    );
    listenForModifierKeys(signal);
    listenForMonkeyKeys(signal);
    // any previously rendered words are gone, start a fresh test
    void restart({ noAnim: true });

    updateFooterAndVerticalAds(false);
    resetIncompleteTests();
    // registered last so it runs after the modules above have unbound
    signal.addEventListener("abort", () => {
      void Funbox.clear();
      updateFooterAndVerticalAds(true);
    });

    window.addEventListener(
      "blur",
      () => setTestFocusState("unfocusedWindow"),
      { signal },
    );
    window.addEventListener("focus", restartIfNotStarted, { signal });
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
  // classes shared by #words and #wordsWrapper
  const modeClasses = (): Record<string, boolean> => ({
    tape: getConfig.tapeMode !== "off",
    blind: getConfig.blindMode,
    indicateTyposBelow:
      getConfig.indicateTypos === "below" || getConfig.indicateTypos === "both",
    hideExtraLetters: getConfig.hideExtraLetters,
  });

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
          class={cn("content-grid full-width", modeClasses(), {
            hidden: isWordsWrapperHidden(),
          })}
          translate="no"
          onClick={() => {
            TestUI.focusWords();
          }}
        >
          <textarea
            id="wordsInput"
            ref={(el) => (inputRef = el)}
            class="full-width"
            autocomplete="off"
            // oxlint-disable-next-line react/no-unknown-property
            autocapitalize="off"
            // oxlint-disable-next-line react/no-unknown-property
            autocorrect="off"
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            data-bwignore=""
            data-1p-ignore=""
            data-lpignore="true"
            data-form-type="other"
            // oxlint-disable-next-line react/no-unknown-property
            spellcheck={false}
            style={{ "font-size": fontSize() }}
            onFocus={() => {
              if (!isInputElementFocused()) return;
              if (!getResultVisible() && getConfig.showOutOfFocusWarning) {
                setTestFocusState("focused");
              }
              Caret.show(true);
            }}
            onBlur={() => {
              if (!isInputElementFocused()) {
                setTestFocusState("unfocused");
              }
              Caret.hide();
            }}
          ></textarea>
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
          <div
            id="words"
            ref={(el) => (wordsRef = el)}
            class={cn("full-width", {
              ...modeClasses(),
              flipped: getConfig.flipTestColors,
              colorfulMode: getConfig.colorfulMode,
              rightToLeftTest: isLanguageRightToLeft(),
              ...prefixedClass("highlight", getConfig.highlightMode),
              ...prefixedClass("typed-effect", getConfig.typedEffect),
              blurred: showOutOfFocusWarning(),
              hidden: isWordsHidden(),
              read_ahead_disabled: isReadAheadDisabled(),
              noErrorBorder: isErrorBorderDisabled(),
              joiningScript: isJoiningScript(),
            })}
            style={{ transition: showOutOfFocusWarning() ? "0.25s" : "none" }}
          ></div>
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
      <Show when={getShowResult()}>
        <TestResult />
      </Show>
    </>
  );
}
