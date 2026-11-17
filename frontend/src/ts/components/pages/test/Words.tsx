import { CaretStyle } from "@monkeytype/schemas/configs";
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
  firstMountedIndex,
  isWordRendered,
  wordsRenderState,
} from "../../../states/words-render";
import { paceCaretTarget } from "../../../test/pace-caret";
import { cn } from "../../../utils/cn";
import { isCaretDebug } from "./caret";
import { Word } from "./Word";
import { createWordRegistry, type WordRegistry } from "./word-registry";
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
  const registry = createWordRegistry();
  // reads its elements lazily, they mount after it
  const layout = createWordsLayout({
    registry,
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

  return (
    <>
      <Caret
        id="paceCaret"
        ref={(el) => (paceCaretRef = el)}
        caretStyle={getConfig.paceCaretStyle}
        hidden={paceCaretTarget() === undefined}
        debug={isCaretDebug()}
      />
      <Caret
        id="caret"
        ref={(el) => (caretRef = el)}
        caretStyle={getConfig.caretStyle}
        hidden={!layout.isCaretShown()}
        // it stops blinking while typing
        blink={
          isFocusMode()
            ? "none"
            : getConfig.smoothCaret === "off"
              ? "caretFlashHard"
              : "caretFlashSmooth"
        }
      />
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
                <Word
                  word={word}
                  isActive={isActive}
                  register={registry.registerWord}
                />
              </Show>
              <Show when={word.endsLine}>
                <LineBreak
                  index={word.index}
                  register={registry.registerLineBreak}
                />
              </Show>
            </>
          )}
        </For>
      </div>
    </>
  );
}

/**
 * A caret element (#caret, #paceCaret). Words' layout moves it through its
 * ref; this renders its style class, visibility and blinking.
 */
function Caret(props: {
  id: string;
  ref: (el: HTMLDivElement) => void;
  caretStyle: CaretStyle;
  hidden: boolean;
  /** outlined, dev options' caret debug */
  debug?: boolean;
  /** its blink animation, the stylesheet's when undefined */
  blink?: "none" | "caretFlashHard" | "caretFlashSmooth";
}): JSXElement {
  return (
    <div
      id={props.id}
      ref={props.ref}
      data-ui-element={props.id}
      data-ui-variant={props.caretStyle}
      // the style class stays for legacy theme selectors (#caret.banana)
      // not cn: tailwind-merge drops a style class like block next to hidden
      class={clsx("full-width", props.caretStyle, {
        hidden: props.hidden,
        debug: props.debug,
      })}
      style={{
        "font-size": `${getConfig.fontSize}rem`,
        "animation-name": props.blink,
      }}
    ></div>
  );
}

/** The line break after word `index`, registered for the layout. */
function LineBreak(props: {
  index: number;
  register: WordRegistry["registerLineBreak"];
}): JSXElement {
  let beforeRef: HTMLDivElement | undefined;
  let afterRef: HTMLDivElement | undefined;

  onMount(() => {
    if (beforeRef === undefined || afterRef === undefined) return;
    const index = props.index;
    onCleanup(props.register(index, { before: beforeRef, after: afterRef }));
  });

  return (
    <>
      <div ref={(el) => (beforeRef = el)} class="beforeNewline"></div>
      <div class="newline"></div>
      <div ref={(el) => (afterRef = el)} class="afterNewline"></div>
    </>
  );
}
