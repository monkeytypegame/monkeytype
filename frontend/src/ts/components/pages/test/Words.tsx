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
import { cn } from "../../../utils/cn";
import { Word } from "./Word";
import { createWordsLayout, WordsLayout } from "./words-layout";

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

/** Renders #words with the test words, and lays them out (WordsLayout). */
export function Words(props: {
  /** receives the layout, before any onMount runs */
  layoutRef?: (layout: WordsLayout) => void;
  wordsWrapperRef?: () => HTMLElement | undefined;
  onActiveWordLaidOut?: () => void;
}): JSXElement {
  let wordsRef: HTMLDivElement | undefined;
  // reads its elements lazily: handed out now, before any onMount runs
  const layout = createWordsLayout({
    words: () => wordsRef,
    wordsWrapper: () => props.wordsWrapperRef?.(),
    onActiveWordLaidOut: () => props.onActiveWordLaidOut?.(),
  });
  // handed out once, like a ref
  // oxlint-disable-next-line solid/reactivity
  props.layoutRef?.(layout);
  // drops a line jump still animating
  onCleanup(() => layout.reset());

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
    <div
      id="words"
      ref={(el) => (wordsRef = el)}
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
