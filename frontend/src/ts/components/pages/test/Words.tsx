import { createMemo, createSelector, For, JSXElement, Show } from "solid-js";

import { isWordRendered, wordsRenderState } from "../../../states/words-render";
import { Word } from "./Word";

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
      .filter((word) => isWordRendered(word.index) || word.endsLine),
  );

  return (
    <For each={wordItems()}>
      {(word) => (
        <>
          <Show when={isWordRendered(word.index)}>
            <Word word={word} isActive={isActive} />
          </Show>
          <Show when={word.endsLine}>
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
