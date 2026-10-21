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
import { isWordRightToLeft, splitIntoCharacters } from "../../../utils/strings";
import { FaProps } from "../../common/Fa";
import { registerWordElement, unregisterWordElement } from "./word-elements";
import { Letter, LetterStatus, WordLetter } from "./WordLetter";

const ICONS: Map<string, FaProps> = new Map([
  [
    "\t",
    {
      variant: "solid",
      icon: "fa-long-arrow-alt-right",
      fixedWidth: true,
    },
  ],
  [
    "\n",
    {
      variant: "solid",
      icon: "fa-level-down-alt",
      fixedWidth: true,
      class: "fa-rotate-90",
    },
  ],
  ["←", { variant: "solid", icon: "fa-arrow-left" }],
  ["↓", { variant: "solid", icon: "fa-arrow-down" }],
  ["↑", { variant: "solid", icon: "fa-arrow-up" }],
  ["→", { variant: "solid", icon: "fa-arrow-right" }],
]);

function getCharIconProps(char: string | undefined): FaProps | undefined {
  return ICONS.get(char ?? "");
}

function getLetterControlType(char: string | undefined): Letter["controlType"] {
  if (char === "\t") return "tab";
  if (char === "\n") return "newline";
  return undefined;
}

/**
 * Letter showing `shown` (icon chars as icons). The tab/newline marker class
 * comes from the `expected` char, so a typo on a tab/newline keeps it.
 */
function createLetter(
  shown: string,
  status: LetterStatus,
  expected: string | undefined,
): Letter {
  const icon = getCharIconProps(shown);
  return {
    text: icon === undefined ? shown : "",
    icon,
    status,
    controlType: getLetterControlType(expected),
  };
}

/** typed space shows as "_" */
function visibleChar(typed: string): string {
  return typed === " " ? "_" : typed;
}

function typedStatus(
  typed: string,
  expected: string | undefined,
): LetterStatus {
  if (typed === expected) return "correct";
  if (expected === undefined) return "extra";
  return "incorrect";
}

function zenLetters(input: string, composition: string): Letter[] {
  const letters: Letter[] = splitIntoCharacters(input).map((char) => {
    const icon = getCharIconProps(char);
    if (icon === undefined) return { text: char, status: "correct" };
    return { ...createLetter(char, "correct", char), hidden: true };
  });
  if (input === "" && composition === "") {
    letters.push({ text: "_", status: "untyped", hidden: true });
  }
  for (const char of splitIntoCharacters(composition)) {
    letters.push({ text: char, status: "dead" });
  }
  return letters;
}

function wordLetters(word: RenderedWord): Letter[] {
  if (wordsRenderState.rendersLettersFromInput) {
    return zenLetters(word.input, word.composition);
  }

  const config = getConfig;
  const wordChars = splitIntoCharacters(word.text);
  const inputChars = splitIntoCharacters(word.input);
  const compositionChars = splitIntoCharacters(word.composition);
  const replaceTypos =
    config.indicateTypos === "replace" || config.indicateTypos === "both";
  const letters: Letter[] = [];

  for (let i = 0; i < inputChars.length; i++) {
    const expected = wordChars[i];
    const typed = inputChars[i] as string;
    const status = typedStatus(typed, expected);
    // typos show the expected letter unless replaced; extras only have the typed one
    const showExpected =
      expected !== undefined && (status === "correct" || !replaceTypos);
    letters.push(
      createLetter(
        showExpected ? expected : visibleChar(typed),
        status,
        expected,
      ),
    );
  }

  for (let i = 0; i < compositionChars.length; i++) {
    const char = compositionChars[i] as string;
    const expected = wordChars[inputChars.length + i];
    letters.push({
      text:
        config.compositionDisplay === "replace"
          ? visibleChar(char)
          : (expected ?? char),
      status: char === expected ? "deadCorrect" : "dead",
    });
  }

  for (
    let i = inputChars.length + compositionChars.length;
    i < wordChars.length;
    i++
  ) {
    const char = wordChars[i] as string;
    letters.push(createLetter(char, "untyped", char));
  }

  return letters;
}

export function Word(props: {
  word: RenderedWord;
  isActive: (index: number) => boolean;
}): JSXElement {
  const letters = createMemo(() => wordLetters(props.word));
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
          {(letter) => (
            <WordLetter letter={letter()} allCorrect={props.word.allCorrect} />
          )}
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
