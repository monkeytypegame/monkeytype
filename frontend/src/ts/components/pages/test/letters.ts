import { splitIntoCharacters } from "../../../utils/strings";
import type { Letter, LetterStatus } from "./WordLetter";

/**
 * Display rules of the test words: what each letter shows and how it's
 * marked. Pure, the WordLetter component only renders the result.
 */

export type TextLettersSettings = {
  /** indicate typos replace/both: typos show the typed char */
  replaceTypos: boolean;
  /** composition display replace: composing chars show as typed */
  replaceComposition: boolean;
};

type WordChars = {
  text: string;
  input: string;
  composition: string;
  /** blind mode: the word's letters show as correct */
  allCorrect: boolean;
};

function getControlType(char: string | undefined): Letter["controlType"] {
  if (char === "\t") return "tab";
  if (char === "\n") return "newline";
  return undefined;
}

/** typed space shows as "_" */
function visibleChar(typed: string): string {
  return typed === " " ? "_" : typed;
}

function getLetterStatus(
  typed: string,
  expected: string | undefined,
): LetterStatus {
  if (typed === expected) return "correct";
  if (expected === undefined) return "extra";
  return "incorrect";
}

/** zen: letters come from the input only */
export function createZenLetters(input: string, composition: string): Letter[] {
  // placeholder for empty input
  if (input === "" && composition === "") {
    return [{ text: "_", status: "untyped", hidden: true }];
  }

  // input: typed tab/newline take up space but stay invisible
  const letters: Letter[] = splitIntoCharacters(input).map((inputChar) => {
    const controlType = getControlType(inputChar);
    return {
      text: inputChar,
      status: "correct",
      controlType,
      hidden: controlType !== undefined,
    };
  });

  // composition
  for (const char of splitIntoCharacters(composition)) {
    letters.push({ text: char, status: "dead" });
  }

  return letters;
}

/** letters of `word.text`, marked against the input */
export function createTextLetters(
  word: WordChars,
  settings: TextLettersSettings,
): Letter[] {
  const wordChars = splitIntoCharacters(word.text);
  const inputChars = splitIntoCharacters(word.input);
  const compositionChars = splitIntoCharacters(word.composition);
  const letters: Letter[] = [];

  for (let i = 0; i < inputChars.length; i++) {
    const targetChar = wordChars[i];
    const inputChar = inputChars[i] as string;
    const status = getLetterStatus(inputChar, targetChar);
    // typos show the expected letter unless replaced; extras only have the typed one
    const showTarget =
      targetChar !== undefined &&
      (status === "correct" || !settings.replaceTypos);
    letters.push({
      text: showTarget ? targetChar : visibleChar(inputChar),
      status,
      // from the target: a typo on a tab/newline keeps its marker class
      controlType: getControlType(targetChar),
    });
  }

  for (let i = 0; i < compositionChars.length; i++) {
    const char = compositionChars[i] as string;
    const expected = wordChars[inputChars.length + i];
    letters.push({
      text: settings.replaceComposition
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
    const targetChar = wordChars[i] as string;
    letters.push({
      text: targetChar,
      status: "untyped",
      controlType: getControlType(targetChar),
    });
  }

  if (word.allCorrect) {
    // incorrect/extra keep their classes: blind CSS hides extras
    for (const letter of letters) {
      if (letter.status !== "correct" && letter.status !== "deadCorrect") {
        letter.markedCorrect = true;
      }
    }
  }

  return letters;
}
