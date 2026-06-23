import { Config } from "../../config/store";
import { isSpace } from "../../utils/strings";
import { isFunboxActiveWithProperty } from "../../test/funbox/list";
import * as TestWords from "../../test/test-words";

type SharedOptions = {
  data: string;
  inputValue: string;
  targetWord: string;
};

/**
 * Check if the input data is correct
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value (use getCurrentInput(), not input element value)
 * @param options.targetWord - Target word
 * @param options.correctShiftUsed - Whether the correct shift state was used. Null means disabled
 */
export function isCharCorrect(
  options: SharedOptions & {
    correctShiftUsed: boolean | null; //null means disabled
  },
): boolean {
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
 * Check if the input data is correct
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value (use getCurrentInput(), not input element value)
 * @param options.targetWord - Target word
 * @param options.correctShiftUsed - Whether the correct shift state was used. Null means disabled
 */
export function isWordCorrect(
  options: SharedOptions & {
    correctShiftUsed: boolean | null; //null means disabled
  },
): boolean {
  const { data, inputValue, targetWord, correctShiftUsed } = options;

  if (Config.mode === "zen") return true;
  if (correctShiftUsed === false) return false;

  const finalInputValue = inputValue + (isSpace(data) ? "" : data);
  return finalInputValue === targetWord;
}

/**
 * Determines if a character should commit the current word
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value (use getCurrentInput(), not input element value)
 */
export function isCommitCharacter(
  options: Omit<SharedOptions, "targetWord"> & {
    data: string;
    inputValue: string;
  },
): boolean {
  const { data, inputValue } = options;

  const charIsSpace = isSpace(data);
  const charIsNewline = data === "\n";
  const noSpaceForce =
    isFunboxActiveWithProperty("nospace") &&
    (inputValue + data).length === TestWords.words.getCurrentText().length;

  return charIsSpace || charIsNewline || noSpaceForce;
}

/**
 * Determines if we should move on to the next word or not.
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value (use getCurrentInput(), not input element value)
 * @param options.targetWord - Target word
 * @param options.isCommitChar - Whether this character commits the current word
 */
export function shouldJumpToNextWord(
  options: SharedOptions & {
    isCommitChar?: boolean;
  },
): boolean {
  const {
    data,
    inputValue,
    targetWord,
    isCommitChar = isCommitCharacter({ data, inputValue }),
  } = options;

  if (Config.mode === "zen") {
    return false;
  }

  const correct = isWordCorrect({
    data,
    inputValue,
    targetWord,
    correctShiftUsed: null,
  });

  const stopOnErrorLetterAndIncorrect =
    Config.stopOnError === "letter" && !correct;
  const stopOnErrorWordAndIncorrect = Config.stopOnError === "word" && !correct;
  const strictSpace =
    isSpace(data) &&
    inputValue.length === 0 &&
    (Config.strictSpace || Config.difficulty !== "normal");

  return (
    isCommitChar &&
    !(
      stopOnErrorLetterAndIncorrect ||
      stopOnErrorWordAndIncorrect ||
      strictSpace
    )
  );
}
