import { createMemo, createSelector, For, JSXElement } from "solid-js";

import { wordsRenderState } from "../../../states/words-render";
import { Word, wordHasNewline } from "./Word";

/** Renders the test words. Mounted inside #words. */
export function Words(): JSXElement {
  const isActive = createSelector(
    () => wordsRenderState.renderedActiveWordIndex,
  );
  const visibleWords = createMemo(() => {
    const { words, firstRenderedWordIndex, firstRenderedLineBreakIndex } =
      wordsRenderState;
    const shown = words.slice(firstRenderedWordIndex);
    // tape hidden words ending a line keep their line break, so the lines
    // don't collapse
    const lineEnds = words
      .slice(firstRenderedLineBreakIndex, firstRenderedWordIndex)
      .filter((word) => wordHasNewline(word));
    return lineEnds.length === 0 ? shown : [...lineEnds, ...shown];
  });

  return (
    <For each={visibleWords()}>
      {(word) => <Word word={word} isActive={isActive} />}
    </For>
  );
}
