import { createMemo, createSelector, For, JSXElement, Show } from "solid-js";

import { RenderedWord, wordsRenderState } from "../../../states/words-render";
import { Word } from "./Word";

/** Whether the word is followed by a line break (zen: typed newline). */
function wordHasNewline(word: RenderedWord): boolean {
  return (
    wordsRenderState.rendersLettersFromInput ? word.input : word.text
  ).includes("\n");
}

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
      {(word) => (
        <>
          <Show when={word.index >= wordsRenderState.firstRenderedWordIndex}>
            <Word word={word} isActive={isActive} />
          </Show>
          <Show when={wordHasNewline(word)}>
            <LineBreak />
          </Show>
        </>
      )}
    </For>
  );
}

function LineBreak(): JSXElement {
  return (
    <>
      <div class="beforeNewline"></div>
      <div class="newline"></div>
      <div class="afterNewline"></div>
    </>
  );
}
