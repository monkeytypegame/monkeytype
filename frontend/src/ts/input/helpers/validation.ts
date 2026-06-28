import { Config } from "../../config/store";
import { type CommitCharacterType } from "./util";

/**
 * Check if the input data is correct
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value (use getCurrentInput(), not input element value)
 * @param options.targetWord - Target word
 * @param options.correctShiftUsed - Whether the correct shift state was used. Null means disabled
 */
export function isCharCorrect(options: {
  data: string;
  inputValue: string;
  targetWord: string;
  correctShiftUsed: boolean | null; //null means disabled
}): boolean {
  const { data, inputValue, targetWord, correctShiftUsed } = options;

  if (Config.mode === "zen") return true;
  if (correctShiftUsed === false) return false;

  const targetChar = targetWord[inputValue.length];

  if (targetChar === undefined) {
    return false;
  }

  return data === targetChar;
}

/**
 * Check if the input data should move to the next word
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value
 * @param options.targetWord - Target word
 */
export function shouldGoToNextWord(options: {
  data: string;
  inputValue: string;
  targetWord: string;
  commitCharacterType: CommitCharacterType | false;
}): boolean {
  const {
    inputValue,
    targetWord,
    data,
    commitCharacterType: commitType,
  } = options;

  if (commitType === false) return false;

  if (Config.mode === "zen") return true;

  //strict space: a leading separator on empty input must not skip the word.
  //nospace commits (final letter of a 1-letter word) are legitimate here.
  if (
    inputValue.length === 0 &&
    commitType === "separator" &&
    (Config.strictSpace || Config.difficulty !== "normal")
  ) {
    return false;
  }

  const correct = inputValue + data === targetWord;

  //stop on error
  if (Config.stopOnError === "word" && !correct) {
    return false;
  }

  if (Config.stopOnError === "letter" && !correct) {
    return false;
  }

  return true;
}
