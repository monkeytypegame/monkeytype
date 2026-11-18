import { splitIntoCharacters } from "../../../utils/strings";
import type { RenderedLetter, LetterStatus } from "./WordLetter";

/**
 * Display rules of the test words: what each letter shows and how it's
 * marked. Pure, the WordLetter component only renders the result.
 */

type Settings = {
  /** indicate typos replace/both: typos show the typed char */
  replaceTypos: boolean;
  /** composition display replace: composing chars show as typed */
  replaceComposition: boolean;
};

type WordChars = {
  text: string;
  input: string;
  composition: string;
};

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
export function createZenLetters(
  input: string,
  composition: string,
): RenderedLetter[] {
  // placeholder for empty input
  if (input === "" && composition === "") {
    return [{ text: "_", status: "untyped", invisible: true }];
  }

  // input: typed tab/newline take up space but stay invisible
  const letters: RenderedLetter[] = splitIntoCharacters(input).map(
    (inputChar) => ({
      text: inputChar,
      status: "correct",
      invisible: inputChar === "\t" || inputChar === "\n",
    }),
  );

  // composition
  for (const char of splitIntoCharacters(composition)) {
    letters.push({ text: char, status: "dead" });
  }

  return letters;
}

/** letters of `word.text`, marked against the input */
export function createLetters(
  word: WordChars,
  settings: Settings,
): RenderedLetter[] {
  const wordChars = splitIntoCharacters(word.text);
  const inputChars = splitIntoCharacters(word.input);
  const compositionChars = splitIntoCharacters(word.composition);
  const letters: RenderedLetter[] = [];

  // input
  for (let i = 0; i < inputChars.length; i++) {
    const targetChar = wordChars[i];
    const inputChar = inputChars[i] as string;
    const status = getLetterStatus(inputChar, targetChar);

    let text = visibleChar(inputChar);

    // typos show the expected letter unless replaced
    if (status === "incorrect" && !settings.replaceTypos) {
      text = targetChar ?? text;
    }

    letters.push({ text, status });
  }

  // composition
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

  // untyped letters at the end of the word
  for (
    let i = inputChars.length + compositionChars.length;
    i < wordChars.length;
    i++
  ) {
    const targetChar = wordChars[i] as string;
    letters.push({ text: targetChar, status: "untyped" });
  }

  return letters;
}
