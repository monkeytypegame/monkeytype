import { JSXElement, onMount } from "solid-js";

import { initInputListeners } from "../../../input/listeners";
import * as Caret from "../../../test/caret";
import * as PaceCaret from "../../../test/pace-caret";
import * as TestUI from "../../../test/test-ui";
import { ElementWithUtils } from "../../../utils/dom";
import { CapsWarning } from "./CapsWarning";
import { CompositionDisplay } from "./CompositionDisplay";
import { Keymap } from "./Keymap";
import { LiveStatsMini } from "./live-stats/LiveStatsMini";
import { LiveStatsTextBottom } from "./live-stats/LiveStatsTextBottom";
import { LiveStatsTextTop } from "./live-stats/LiveStatsTextTop";
import { TestModesNotice } from "./modes-notice/TestModesNotice";
import { Monkey } from "./Monkey";
import { OutOfFocusWarning } from "./OutOfFocusWarning";
import { Premid } from "./Premid";
import { TestResult } from "./result/TestResult";
import { TestConfig } from "./TestConfig";

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

      <div id="testInitFailed" class="content-grid hidden">
        <div class="message">
          <div class="text">
            Test initialization failed. Please try different settings or
            refreshing the page. If the problem persists, please contact
            support.
          </div>
          <div class="error"></div>
          <button type="button" class="active restart">
            <i class="fas fa-fw fa-redo-alt"></i> Restart
          </button>
        </div>
      </div>
      <div id="typingTest" class="content-grid full-width-padding">
        <div>
          <CapsWarning />
        </div>
        <div id="memoryTimer">Time left to memorise all words: 0s</div>
        <div id="layoutfluidTimer">Time left to memorise all words: 0s</div>
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

        <button
          type="button"
          id="restartTestButton"
          aria-label="Restart Test"
          data-balloon-pos="down"
          class="text"
        >
          <i class="fas fa-fw fa-redo-alt"></i>
        </button>
        <div>
          <LiveStatsTextBottom />
        </div>
        <div>
          <Premid />
        </div>
      </div>
      <div class="loading hidden">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
      <TestResult />
    </>
  );
}
