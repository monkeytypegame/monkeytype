import { createMemo, Index, JSXElement, onCleanup, onMount } from "solid-js";

import type { WordRegistry } from "./word-registry";

import { getConfig } from "../../../config/store";
import { RenderedWord, wordsRenderState } from "../../../states/words-render";
import { cn } from "../../../utils/cn";
import { createLetters, createZenLetters } from "./letters";
import { TypoHints } from "./TypoHints";
import { WordLetter } from "./WordLetter";

export type WordStatus = "untyped" | "typed" | "typedIncorrectly";

/** A rendered word: its letters and hints container. */
export function Word(props: {
  word: RenderedWord;
  isActive: (index: number) => boolean;
  /** registers its element while mounted, for the layout */
  register: WordRegistry["registerWord"];
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
  // the rendered letters in order, filled by their refs
  const letterRefs: HTMLElement[] = [];
  const getLetter = (index: number): HTMLElement | undefined =>
    letterRefs[index];

  onMount(() => {
    const el = wordRef;
    if (el === undefined) return;
    onCleanup(
      props.register(props.word.index, {
        el,
        getLetter,
        getLetterCount: () => letterRefs.length,
      }),
    );
  });

  return (
    <div
      ref={(el) => (wordRef = el)}
      data-wordindex={props.word.index}
      data-ui-element="word"
      dir={props.word.direction}
      data-ui-state={status()}
      data-ui-active={props.isActive(props.word.index) ? "" : undefined}
      class={cn("word", {
        active: props.isActive(props.word.index),
        typed: props.word.isTyped,
        error: isIncorrect(),
        // letters run in the word's direction, so the caret can rely on it
        "[unicode-bidi:bidi-override]": props.word.direction !== undefined,
      })}
    >
      <Index each={letters()}>
        {(letter, i) => {
          // removed letters are always the last ones
          onCleanup(() => {
            letterRefs.length = Math.min(letterRefs.length, i);
          });
          return (
            <WordLetter letter={letter()} ref={(el) => (letterRefs[i] = el)} />
          );
        }}
      </Index>
      <TypoHints word={props.word} getLetter={getLetter} />
    </div>
  );
}
