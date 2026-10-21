import {
  createMemo,
  Index,
  JSXElement,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { getConfig } from "../../../config/store";
import {
  RenderedWord,
  wordEndsLine,
  wordsRenderState,
} from "../../../states/words-render";
import { isWordRightToLeft } from "../../../utils/strings";
import { createTextLetters, createZenLetters } from "./letters";
import { registerWordElement, unregisterWordElement } from "./word-elements";
import { WordLetter } from "./WordLetter";

export function Word(props: {
  word: RenderedWord;
  isActive: (index: number) => boolean;
}): JSXElement {
  const letters = createMemo(() =>
    wordsRenderState.rendersLettersFromInput
      ? createZenLetters(props.word.input, props.word.composition)
      : createTextLetters(props.word, {
          replaceTypos:
            getConfig.indicateTypos === "replace" ||
            getConfig.indicateTypos === "both",
          replaceComposition: getConfig.compositionDisplay === "replace",
        }),
  );
  const hasNewline = (): boolean => wordEndsLine(props.word);
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
    <>
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
          error: props.word.isIncorrect,
          wordRtl: isRtl(),
        }}
      >
        <Index each={letters()}>
          {(letter) => <WordLetter letter={letter()} />}
        </Index>
        <div class="hints"></div>
      </div>
      <Show when={hasNewline()}>
        <div class="beforeNewline"></div>
        <div class="newline"></div>
        <div class="afterNewline"></div>
      </Show>
    </>
  );
}
