// the react rule doesn't know Solid's on: (native listener) bindings
/* oxlint-disable react/no-unknown-property */
import { createEffect, JSXElement, on, onCleanup, onMount } from "solid-js";

import { Config, getConfig } from "../../../config/store";
import { ModifierKeys } from "../../../constants/modifier-keys";
import {
  registerInputElement,
  setInputElementValue,
} from "../../../input/input-element";
import {
  onCompositionEnd,
  onCompositionStart,
  onCompositionUpdate,
} from "../../../input/listeners/composition";
import { onBeforeInput, onInput } from "../../../input/listeners/input";
import { onKeyDown, onKeyUp } from "../../../input/listeners/key";
import {
  onFocus,
  onSelectionChange,
  preventDefault,
} from "../../../input/listeners/misc";
import {
  isRealWordsInputShown,
  isWordsInputFocused,
  setTestFocusState,
  setWordsInputFocused,
  triggerScrollWindowToActiveWord,
  wordsInputPosition,
} from "../../../states/test";
import {
  getTestId,
  isTestActive,
  isTestFinished,
} from "../../../test/engine/state";
import { cn } from "../../../utils/cn";
import { isDevEnvironment } from "../../../utils/env";
import { isAnyPopupVisible } from "../../../utils/misc";
import { focusWordsEvent } from "./focus-words";

/**
 * The hidden textarea the typing test reads input from (#wordsInput). Follows
 * the active word. Listeners bind natively (on:): Solid's delegated handlers
 * would run on document, among its other keydown listeners.
 */
export function WordsInput(): JSXElement {
  let inputRef: HTMLTextAreaElement | undefined;

  // a restart committed a new test: the old test's input goes (keys are
  // refused until it has faded in)
  createEffect(
    on(
      getTestId,
      () => {
        if (inputRef !== undefined) setInputElementValue("");
      },
      { defer: true },
    ),
  );

  onMount(() => {
    if (inputRef === undefined) throw new Error("WordsInput ref not set");
    onCleanup(registerInputElement(inputRef));
    onCleanup(() => setWordsInputFocused(false));

    // autofocus the words when typing anywhere on the page
    document.addEventListener("keydown", autofocusWords);
    onCleanup(() => document.removeEventListener("keydown", autofocusWords));
  });

  focusWordsEvent.useListener(({ force }) => {
    if (force) inputRef?.blur();
    inputRef?.focus({ preventScroll: true });
    if (isTestActive()) triggerScrollWindowToActiveWord();
  });

  const px = (value: number | undefined): string | undefined =>
    value === undefined ? undefined : `${value}px`;

  return (
    <textarea
      id="wordsInput"
      ref={(el) => (inputRef = el)}
      class={cn(
        "full-width pointer-events-none absolute -z-1 mx-auto my-0 block h-[1em] w-0 cursor-default resize-none overflow-hidden rounded-none border-none p-0 caret-transparent opacity-0 contain-strict outline-none",
        // if the text wraps, ctrl backspace will not work on firefox >:|
        // and holy shit do not use white-space: nowrap here because the hellspawn that is safari
        // is TRIMMING the value on focus when using that (and the input system relies on a leading space)
        "[text-wrap-mode:nowrap]",
        // centered on wordsInputPosition's centerY
        "-translate-y-1/2",
        {
          // "mt-[1em]": isRealWordsInputShown(),
          "caret-error opacity-100": isRealWordsInputShown(),
        },
      )}
      autocomplete="off"
      autocapitalize="off"
      autocorrect="off"
      data-gramm="false"
      data-gramm_editor="false"
      data-enable-grammarly="false"
      data-bwignore=""
      data-1p-ignore=""
      data-lpignore="true"
      data-form-type="other"
      spellcheck={false}
      style={{
        "font-size": `${getConfig.fontSize}rem`,
        top: px(wordsInputPosition().centerY),
        left: px(wordsInputPosition().left),
        width: px(wordsInputPosition().width),
        "max-width":
          wordsInputPosition().maxWidth === undefined
            ? undefined
            : `${wordsInputPosition().maxWidth}%`,
      }}
      on:focus={() => {
        if (!isTestFinished() && getConfig.showOutOfFocusWarning) {
          setTestFocusState("focused");
        }
        setWordsInputFocused(true);
        onFocus();
      }}
      on:blur={() => {
        setWordsInputFocused(false);
        setTestFocusState("unfocused");
      }}
      on:compositionstart={onCompositionStart}
      on:compositionupdate={onCompositionUpdate}
      on:compositionend={onCompositionEnd}
      on:keyup={onKeyUp}
      on:keydown={onKeyDown}
      on:beforeinput={onBeforeInput}
      on:input={onInput}
      on:copy={preventDefault}
      on:paste={preventDefault}
      on:select={preventDefault}
      on:selectstart={preventDefault}
      on:selectionchange={onSelectionChange}
    ></textarea>
  );
}

function autofocusWords(e: KeyboardEvent): void {
  if (e.key === undefined) return;

  if (isDevEnvironment()) {
    if (
      (document.activeElement as HTMLElement | undefined)?.dataset[
        "uiElement"
      ] === "signalDevtoolsInput"
    ) {
      return;
    }
  }

  if (isTestFinished() || isWordsInputFocused()) return;
  // checked last, isAnyPopupVisible is a bit expensive
  if (
    ["Enter", " ", "Escape", "Tab", ...ModifierKeys].includes(e.key) ||
    e.metaKey ||
    e.ctrlKey ||
    isAnyPopupVisible()
  ) {
    return;
  }
  focusWordsEvent.dispatch({ force: false });
  if (Config.showOutOfFocusWarning) {
    e.preventDefault();
  }
}
