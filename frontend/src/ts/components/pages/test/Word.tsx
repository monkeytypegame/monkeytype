import { createMemo, Index, JSXElement, onCleanup, onMount } from "solid-js";

import { getConfig } from "../../../config/store";
import {
  registerWordElement,
  unregisterWordElement,
} from "../../../states/word-elements";
import { RenderedWord, wordsRenderState } from "../../../states/words-render";
import { isWordRightToLeft } from "../../../utils/strings";
import { createLetters, createZenLetters } from "./letters";
import { TypoHints } from "./TypoHints";
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
  // committed input (trailing space stripped) differs from the word, same as
  // the commit check. Blind CSS hides it. Zen words have no text to compare
  // against
  const isIncorrect = (): boolean =>
    props.word.isTyped &&
    !wordsRenderState.rendersLettersFromInput &&
    props.word.input !== props.word.text;
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
        typed: props.word.isTyped,
        error: isIncorrect(),
        wordRtl: isRtl(),
      }}
    >
      <Index each={letters()}>
        {(letter) => <WordLetter letter={letter()} />}
      </Index>
      <TypoHints word={props.word} />
    </div>
  );
}
