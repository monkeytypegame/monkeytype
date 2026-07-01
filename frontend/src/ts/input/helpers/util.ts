import { isFunboxActiveWithProperty } from "../../test/funbox/list";
import { areCharactersVisuallyEqual, isSpace } from "../../utils/strings";
import { Config } from "../../config/store";

/**
 * What kind of commit a character triggers, or false if it does not commit.
 * - "separator": a space or newline that ends the current word
 * - "nospace": the final letter of a word in a nospace funbox
 */
export type CommitCharacterType = "separator" | "nospace";

export function getCommitCharacterType(options: {
  data: string;
  inputValue: string;
  targetWord: string;
}): CommitCharacterType | false {
  const { data, inputValue, targetWord } = options;

  if (isSpace(data)) {
    return "separator";
  }

  if (data === "\n") {
    return "separator";
  }

  const nospace = isFunboxActiveWithProperty("nospace");

  if (nospace && (inputValue + data).length === targetWord.length) {
    return "nospace";
  }

  return false;
}

/**
 * Normalize data to the target char when they are visually equivalent
 * (e.g. IME U+3000 space → U+0020), so commit/correctness checks are consistent.
 * Pure — no input-element side effects.
 */
export function normalizeData(
  data: string,
  inputValue: string,
  targetWord: string,
): string {
  const targetChar = targetWord[inputValue.length];
  if (
    targetChar !== undefined &&
    areCharactersVisuallyEqual(data, targetChar, Config.language)
  ) {
    return targetChar;
  }
  return data;
}
