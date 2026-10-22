import { createMemo, createSelector, For, JSXElement, Show } from "solid-js";

import {
  isWordRendered,
  RenderedWord,
  wordsRenderState,
} from "../../../states/words-render";
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
  // words that render anything: the word, or only its line break (tape
  // hidden words ending a line keep it, so the lines don't collapse)
  const wordItems = createMemo(() =>
    wordsRenderState.words
      .slice(wordsRenderState.firstRenderedLineBreakIndex)
      .filter((word) => isWordRendered(word.index) || wordHasNewline(word)),
  );

  return (
    <For each={wordItems()}>
      {(word) => (
        <>
          <Show when={isWordRendered(word.index)}>
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
