// @refresh reload
// vanilla test code holds refs into this tree (see onMount), so a hot
// remount would orphan them. full reload instead until test-ui is solid.
// todo: remove this once test-ui is solid
import { JSXElement, onMount, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { initInputListeners } from "../../../input/listeners";
import { getShowResult } from "../../../states/result";
import {
  getFocus,
  getLayoutfluidTimerText,
  isLayoutfluidTimerVisible,
  isResultLoading,
  isTestInitFailed,
} from "../../../states/test";
import * as Caret from "../../../test/caret";
import * as PaceCaret from "../../../test/pace-caret";
import { onRestartButtonClick } from "../../../test/test-logic";
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

/**
 * Renders the children of the static `.page.pageTest` element.
 * Internals are still vanilla - this only owns the markup and binds the
 * vanilla listeners once it exists. Must stay mounted for the app's lifetime.
 */
export function TestPage(): JSXElement {
  let wordsWrapperRef: HTMLDivElement | undefined;
  let wordsRef: HTMLDivElement | undefined;
  let caretRef: HTMLDivElement | undefined;
  let paceCaretRef: HTMLDivElement | undefined;

  onMount(() => {
    if (
      wordsWrapperRef === undefined ||
      wordsRef === undefined ||
      caretRef === undefined ||
      paceCaretRef === undefined
    ) {
      throw new Error("TestPage refs not set");
    }
    const words = new ElementWithUtils(wordsRef);
    const wordsWrapper = new ElementWithUtils(wordsWrapperRef);
    Caret.initElement({
      caret: new ElementWithUtils(caretRef),
      words,
      wordsWrapper,
    });
    PaceCaret.initElement({
      caret: new ElementWithUtils(paceCaretRef),
      words,
      wordsWrapper,
    });
    initInputListeners();
    TestUI.init();
  });

  return (
    <>
      <div class="full-width">
        <TestConfig />
      </div>

      {/* TODO: inline display instead of class/Show because test-ui/test-logic
          still toggle classes on #typingTest and hold refs into it. Switch to a
          class binding (or Show) once that's moved to signals. */}
      <div
        id="typingTest"
        class="content-grid full-width-padding"
        style={{ display: isTestInitFailed() ? "none" : undefined }}
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
          class="content-grid full-width"
          translate="no"
        >
          <textarea
            id="wordsInput"
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
          ></textarea>
          <div class="contents">
            <OutOfFocusWarning />
          </div>
          <div
            id="paceCaret"
            ref={(el) => (paceCaretRef = el)}
            class="full-width default hidden"
          ></div>
          <div
            id="caret"
            ref={(el) => (caretRef = el)}
            class="full-width default"
          ></div>
          <div
            id="words"
            ref={(el) => (wordsRef = el)}
            class="full-width"
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
