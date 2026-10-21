import { createMemo, Index, JSXElement, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import {
  RenderedWord,
  wordEndsLine,
  wordsRenderState,
} from "../../../states/words-render";
import { getActiveFunboxes } from "../../../test/funbox/list";
import { FaSolidIcon } from "../../../types/font-awesome";
import { splitIntoCharacters } from "../../../utils/strings";
import { FaProps } from "../../common/Fa";
import { Letter, WordLetter } from "./WordLetter";

const TAB_ICON: FaProps = {
  variant: "solid",
  icon: "fa-long-arrow-alt-right",
  fixedWidth: true,
};
const NEWLINE_ICON: FaProps = {
  variant: "solid",
  icon: "fa-level-down-alt",
  fixedWidth: true,
  class: "fa-rotate-90",
};

function charIcon(char: string | undefined): FaProps | undefined {
  if (char === "\t") return TAB_ICON;
  if (char === "\n") return NEWLINE_ICON;
  return undefined;
}

type FunboxIcon = (char: string) => FaSolidIcon | undefined;

/** reads the reactive config, so letters re-render when funboxes change */
function funboxIcon(): FunboxIcon | undefined {
  return getActiveFunboxes().find(
    (funbox) => funbox.functions?.getLetterIcon !== undefined,
  )?.functions?.getLetterIcon;
}

/**
 * untyped or expected letter: funbox icon if any, tab/newline get their
 * icon and marker class
 */
function expectedLetter(char: string, getFunboxIcon?: FunboxIcon): Letter {
  const funboxIconName = getFunboxIcon?.(char);
  if (funboxIconName !== undefined) {
    return { text: "", icon: { icon: funboxIconName } };
  }
  const icon = charIcon(char);
  return {
    text: icon === undefined ? char : "",
    icon,
    tabChar: char === "\t",
    nlChar: char === "\n",
  };
}

/** visible form of a typed character: space -> "_", tab/newline -> icons */
function typedLetter(char: string): Letter {
  const icon = charIcon(char);
  if (icon !== undefined) return { text: "", icon };
  // explicit undefined: overrides the expected letter's icon on typos
  return { text: char === " " ? "_" : char, icon: undefined };
}

function zenLetters(input: string, composition: string): Letter[] {
  const letters: Letter[] = splitIntoCharacters(input).map((char) => {
    const icon = charIcon(char);
    if (icon === undefined) return { text: char, correct: true };
    return { ...expectedLetter(char), correct: true, hidden: true };
  });
  if (input === "" && composition === "") {
    letters.push({ text: "_", invisible: true });
  }
  for (const char of splitIntoCharacters(composition)) {
    letters.push({ text: char, dead: true });
  }
  return letters;
}

function wordLetters(word: RenderedWord): Letter[] {
  if (wordsRenderState.zen) {
    return zenLetters(word.input, word.composition);
  }

  const config = getConfig;
  const wordChars = splitIntoCharacters(word.text);
  const inputChars = splitIntoCharacters(word.input);
  const compositionChars = splitIntoCharacters(word.composition);
  const replaceTypos =
    config.indicateTypos === "replace" || config.indicateTypos === "both";
  const getFunboxIcon = funboxIcon();
  const letters: Letter[] = [];

  for (let i = 0; i < inputChars.length; i++) {
    const expected = wordChars[i];
    const typed = inputChars[i] as string;
    if (expected === typed) {
      letters.push({ ...expectedLetter(typed, getFunboxIcon), correct: true });
    } else if (expected === undefined) {
      letters.push({ ...typedLetter(typed), incorrect: true, extra: true });
    } else {
      const shown = expectedLetter(expected, getFunboxIcon);
      letters.push({
        ...shown,
        ...(replaceTypos ? typedLetter(typed) : {}),
        incorrect: true,
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
    letters.push({ text, dead: true, correct: char === expected });
  }

  for (
    let i = inputChars.length + compositionChars.length;
    i < wordChars.length;
    i++
  ) {
    letters.push(expectedLetter(wordChars[i] as string, getFunboxIcon));
  }

  if (word.allCorrect) {
    for (const letter of letters) letter.correct = true;
  }

  return letters;
}

export function Word(props: {
  word: RenderedWord;
  isActive: (index: number) => boolean;
}): JSXElement {
  const letters = createMemo(() => wordLetters(props.word));
  const hasNewline = (): boolean => wordEndsLine(props.word);

  return (
    <>
      <div
        class="word"
        data-wordindex={props.word.index}
        // per-class toggles: classes and styles added imperatively
        // (break-joining, caret) must survive re-renders
        // oxlint-disable-next-line monkeytype-rules/no-classlist
        classList={{
          active: props.isActive(props.word.index),
          typed: props.word.typed,
          error: props.word.error,
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
