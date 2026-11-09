import { clsx } from "clsx";
import {
  createMemo,
  createSelector,
  For,
  JSXElement,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { getConfig } from "../../../config/store";
import {
  isErrorBorderDisabled,
  isFocusMode,
  isJoiningScript,
  isLanguageRightToLeft,
  isReadAheadDisabled,
  isWordsHidden,
  showOutOfFocusWarning,
} from "../../../states/test";
import {
  registerLineBreakElements,
  unregisterLineBreakElements,
} from "../../../states/word-elements";
import {
  firstMountedIndex,
  isWordRendered,
  wordsRenderState,
} from "../../../states/words-render";
import { paceCaretTarget } from "../../../test/pace-caret";
import { cn } from "../../../utils/cn";
import { isCaretDebug } from "./caret";
import { Word } from "./Word";
import { createWordsLayout } from "./words-layout";

function prefixedClass(
  prefix: string,
  value: string | null,
): Record<string, boolean> {
  if (value === null) return {};
  return { [`${prefix}-${value.replaceAll("_", "-")}`]: true };
}

/** Classes shared by #words and #wordsWrapper. */
export function wordsModeClasses(): Record<string, boolean> {
  return {
    tape: getConfig.tapeMode !== "off",
    blind: getConfig.blindMode,
    indicateTyposBelow:
      getConfig.indicateTypos === "below" || getConfig.indicateTypos === "both",
    hideExtraLetters: getConfig.hideExtraLetters,
  };
}

/**
 * Renders #words with the test words and the carets on them, and lays them
 * out. The only thing that moves the carets.
 */
export function Words(props: {
  wordsWrapperRef?: () => HTMLElement | undefined;
}): JSXElement {
  let wordsRef: HTMLDivElement | undefined;
  let caretRef: HTMLDivElement | undefined;
  let paceCaretRef: HTMLDivElement | undefined;
  // reads its elements lazily, they mount after it
  const layout = createWordsLayout({
    words: () => wordsRef,
    wordsWrapper: () => props.wordsWrapperRef?.(),
    caret: () => caretRef,
    paceCaret: () => paceCaretRef,
  });

  const isActive = createSelector(
    () => wordsRenderState.renderedActiveWordIndex,
  );
  // words that render anything: the word, or only its line break (tape
  // hidden words ending a line keep it, so the lines don't collapse)
  const wordItems = createMemo(() =>
    wordsRenderState.words
      .slice(firstMountedIndex())
      .filter((word) => isWordRendered(word.index) || word.endsLine),
  );

  const caretFontSize = (): string => `${getConfig.fontSize}rem`;

  return (
    <>
      <div
        id="paceCaret"
        ref={(el) => (paceCaretRef = el)}
        data-ui-element="paceCaret"
        // not cn: tailwind-merge drops a style class like block next to hidden
        class={clsx("full-width", getConfig.paceCaretStyle, {
          hidden: paceCaretTarget() === undefined,
          debug: isCaretDebug(),
        })}
        style={{ "font-size": caretFontSize() }}
      ></div>
      <div
        id="caret"
        ref={(el) => (caretRef = el)}
        data-ui-element="caret"
        class={clsx("full-width", getConfig.caretStyle, {
          hidden: !layout.isCaretShown(),
        })}
        style={{
          "font-size": caretFontSize(),
          // it stops blinking while typing
          "animation-name": isFocusMode()
            ? "none"
            : getConfig.smoothCaret === "off"
              ? "caretFlashHard"
              : "caretFlashSmooth",
        }}
      ></div>
      <div
        id="words"
        ref={(el) => (wordsRef = el)}
        data-ui-element="words"
        data-ui-word-highlight={getConfig.highlightMode.replaceAll("_", "-")}
        data-ui-blind={getConfig.blindMode ? "" : undefined}
        data-ui-flipped={getConfig.flipTestColors ? "" : undefined}
        data-ui-colorful={getConfig.colorfulMode ? "" : undefined}
        data-ui-joining-script={isJoiningScript() ? "" : undefined}
        data-ui-rtl={isLanguageRightToLeft() ? "" : undefined}
        class={cn("full-width", {
          ...wordsModeClasses(),
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
        // only what .blurred changes: font size and margins must apply at once,
        // the layout measures them right away
        style={{
          transition: showOutOfFocusWarning()
            ? "opacity 0.25s, filter 0.25s"
            : "none",
        }}
      >
        <For each={wordItems()}>
          {(word) => (
            <>
              <Show when={isWordRendered(word.index)}>
                <Word word={word} isActive={isActive} />
              </Show>
              <Show when={word.endsLine}>
                <LineBreak index={word.index} />
              </Show>
            </>
          )}
        </For>
      </div>
    </>
  );
}

/** The line break after word `index`, registered for the layout. */
function LineBreak(props: { index: number }): JSXElement {
  let beforeRef: HTMLDivElement | undefined;
  let afterRef: HTMLDivElement | undefined;

  onMount(() => {
    if (beforeRef === undefined || afterRef === undefined) return;
    const index = props.index;
    const els = { before: beforeRef, after: afterRef };
    registerLineBreakElements(index, els);
    onCleanup(() => unregisterLineBreakElements(index, els));
  });

  return (
    <>
      <div ref={(el) => (beforeRef = el)} class="beforeNewline"></div>
      <div class="newline"></div>
      <div ref={(el) => (afterRef = el)} class="afterNewline"></div>
    </>
  );
}
