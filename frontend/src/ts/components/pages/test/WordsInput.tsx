// the react rule doesn't know Solid's on: (native listener) bindings
/* oxlint-disable react/no-unknown-property */
import { createEffect, JSXElement, on, onCleanup, onMount } from "solid-js";

import { getConfig } from "../../../config/store";
import {
  isInputElementFocused,
  registerInputElement,
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
  isTestFinished,
  setTestFocusState,
  wordsInputPosition,
} from "../../../states/test";
import * as Caret from "../../../test/caret";
import * as TestUI from "../../../test/test-ui";
import { cn } from "../../../utils/cn";

/**
 * The hidden textarea the typing test reads input from (#wordsInput). Follows
 * the active word. Listeners bind natively (on:): Solid's delegated handlers
 * would run on document, among its other keydown listeners.
 */
export function WordsInput(): JSXElement {
  let inputRef: HTMLTextAreaElement | undefined;

  onMount(() => {
    if (inputRef === undefined) throw new Error("WordsInput ref not set");
    onCleanup(registerInputElement(inputRef));
  });

  // runs after the style binding: measures the applied position
  createEffect(
    on(wordsInputPosition, () => TestUI.keepWordsInputInTheCenter(), {
      defer: true,
    }),
  );

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
        top: px(wordsInputPosition().top),
        left: px(wordsInputPosition().left),
        width: px(wordsInputPosition().width),
        "max-width":
          wordsInputPosition().maxWidth === undefined
            ? undefined
            : `${wordsInputPosition().maxWidth}%`,
      }}
      on:focus={() => {
        if (isInputElementFocused()) {
          if (!isTestFinished() && getConfig.showOutOfFocusWarning) {
            setTestFocusState("focused");
          }
          Caret.show(true);
        }
        onFocus();
      }}
      on:blur={() => {
        if (!isInputElementFocused()) {
          setTestFocusState("unfocused");
        }
        Caret.hide();
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
