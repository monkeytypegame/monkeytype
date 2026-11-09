import { createMemo, Index, JSXElement, onCleanup, onMount } from "solid-js";

import { getConfig } from "../../../config/store";
import {
  registerWordElement,
  unregisterWordElement,
} from "../../../states/word-elements";
import { RenderedWord, wordsRenderState } from "../../../states/words-render";
import { createLetters, createZenLetters } from "./letters";
import { TypoHints } from "./TypoHints";
import { WordLetter } from "./WordLetter";

export type WordStatus = "untyped" | "typed" | "typedIncorrectly";

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
  // committed input (trailing space stripped) differs from the word, same as
  // the commit check. Blind CSS hides it. Zen words have no text to compare
  // against
  const isIncorrect = (): boolean =>
    props.word.isTyped &&
    !wordsRenderState.rendersLettersFromInput &&
    props.word.input !== props.word.text;
  const status = (): WordStatus => {
    if (isIncorrect()) return "typedIncorrectly";
    return props.word.isTyped ? "typed" : "untyped";
  };
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
      data-ui-element="word"
      dir={props.word.direction}
      data-ui-state={status()}
      data-ui-active={props.isActive(props.word.index) ? "" : undefined}
      // per-class toggles: classes and styles added imperatively
      // (break-joining, caret) must survive re-renders
      // oxlint-disable-next-line monkeytype-rules/no-classlist
      classList={{
        active: props.isActive(props.word.index),
        typed: props.word.isTyped,
        error: isIncorrect(),
        // letters run in the word's direction, so the caret can rely on it
        "[unicode-bidi:bidi-override]": props.word.direction !== undefined,
      }}
    >
      <Index each={letters()}>
        {(letter) => <WordLetter letter={letter()} />}
      </Index>
      <TypoHints word={props.word} />
    </div>
  );
}
