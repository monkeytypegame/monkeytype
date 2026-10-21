import { createMemo, createSelector, For, JSXElement } from "solid-js";

import { wordEndsLine, wordsRenderState } from "../../../states/words-render";
import { Word } from "./Word";

declare module "solid-js" {
  // oxlint-disable-next-line typescript/no-namespace
  namespace JSX {
    // interface needed for declaration merging
    // oxlint-disable-next-line typescript/consistent-type-definitions
    interface IntrinsicElements {
      letter: JSX.HTMLAttributes<HTMLElement>;
    }
  }
}

/** Renders the test words. Mounted inside #words. */
export function Words(): JSXElement {
  const isActive = createSelector(
    () => wordsRenderState.renderedActiveWordIndex,
  );
  const visibleWords = createMemo(() => {
    const { words, firstRenderedWordIndex, tapeHiddenBefore } =
      wordsRenderState;
    const shownFrom = Math.max(firstRenderedWordIndex, tapeHiddenBefore);
    const shown = words.slice(shownFrom);
    if (shownFrom === firstRenderedWordIndex) return shown;
    // tape hidden words ending a line stay, so the lines don't collapse
    const lineEnds = words
      .slice(firstRenderedWordIndex, shownFrom)
      .filter((word) => wordEndsLine(word));
    return lineEnds.length === 0 ? shown : [...lineEnds, ...shown];
  });

  return (
    <For each={visibleWords()}>
      {(word) => <Word word={word} isActive={isActive} />}
    </For>
  );
}
