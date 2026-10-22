import { createMemo, Index, JSXElement, onCleanup, onMount } from "solid-js";

import { getConfig } from "../../../config/store";
import { RenderedWord, wordsRenderState } from "../../../states/words-render";
import { isWordRightToLeft } from "../../../utils/strings";
import { createLetters, createZenLetters } from "./letters";
import { registerWordElement, unregisterWordElement } from "./word-elements";
import { WordLetter } from "./WordLetter";

/** A rendered word: its letters and hints container. */
export function Word(props: {
  word: RenderedWord;
  isActive: (index: number) => boolean;
}): JSXElement {
  const letters = createMemo(() =>
    wordsRenderState.rendersLettersFromInput
      ? createZenLetters(props.word.input, props.word.composition)
      : createLetters(props.word, {
          replaceTypos:
            getConfig.indicateTypos === "replace" ||
            getConfig.indicateTypos === "both",
          replaceComposition: getConfig.compositionDisplay === "replace",
        }),
  );
  // whole word right-to-left: bidi override keeps its letters in order
  const isRtl = createMemo(
    () =>
      wordsRenderState.marksRtlWords &&
      isWordRightToLeft(props.word.text, false)[1],
  );
  let wordRef: HTMLDivElement | undefined;

  onMount(() => {
    const el = wordRef;
    if (el === undefined) return;
    const index = props.word.index;
    registerWordElement(index, el);
    onCleanup(() => unregisterWordElement(index, el));
  });

  return (
    <div
      ref={(el) => (wordRef = el)}
      class="word"
      data-wordindex={props.word.index}
      // per-class toggles: classes and styles added imperatively
      // (break-joining, caret) must survive re-renders
      // oxlint-disable-next-line monkeytype-rules/no-classlist
      classList={{
        active: props.isActive(props.word.index),
        typed: props.word.status !== "untyped",
        error: props.word.status === "typedIncorrect",
        wordRtl: isRtl(),
      }}
    >
      <Index each={letters()}>
        {(letter) => <WordLetter letter={letter()} />}
      </Index>
      <div class="hints"></div>
    </div>
  );
}
