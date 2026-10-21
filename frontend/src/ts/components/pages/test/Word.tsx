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

function getLetterControlType(char: string): Letter["controlType"] {
  if (char === "\t") return "tab";
  if (char === "\n") return "newline";
  return undefined;
}

/** expected letter: tab/newline get their icon and marker class */
function expectedLetter(
  char: string,
  status: LetterStatus = "untyped",
): Letter {
  const icon = getCharIconProps(char);
  return {
    text: icon === undefined ? char : "",
    icon,
    status,
    controlType: getLetterControlType(char),
  };
}

/** visible form of a typed character: space -> "_", tab/newline -> icons */
function typedLetter(char: string): Pick<Letter, "text" | "icon"> {
  const icon = getCharIconProps(char);
  if (icon !== undefined) return { text: "", icon };
  // explicit undefined: overrides the expected letter's icon on typos
  return { text: char === " " ? "_" : char, icon: undefined };
}

function zenLetters(input: string, composition: string): Letter[] {
  const letters: Letter[] = splitIntoCharacters(input).map((char) => {
    const icon = getCharIconProps(char);
    if (icon === undefined) return { text: char, status: "correct" };
    return { ...expectedLetter(char, "correct"), hidden: true };
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
    if (expected === typed) {
      letters.push(expectedLetter(typed, "correct"));
    } else if (expected === undefined) {
      letters.push({ ...typedLetter(typed), status: "extra" });
    } else {
      letters.push({
        ...expectedLetter(expected, "incorrect"),
        ...(replaceTypos ? typedLetter(typed) : {}),
      });
    }
  }

  for (let i = 0; i < compositionChars.length; i++) {
    const char = compositionChars[i] as string;
    const expected = wordChars[inputChars.length + i];
    const text =
      config.compositionDisplay === "replace"
        ? char === " "
          ? "_"
          : char
        : (expected ?? char);
    letters.push({
      text,
      status: char === expected ? "deadCorrect" : "dead",
    });
  }

  for (
    let i = inputChars.length + compositionChars.length;
    i < wordChars.length;
    i++
  ) {
    letters.push(expectedLetter(wordChars[i] as string));
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
