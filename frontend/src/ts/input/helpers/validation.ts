import { Config } from "../../config/store";
import { isSpace } from "../../utils/strings";
import { isFunboxActiveWithProperty } from "../../test/funbox/list";
import * as TestWords from "../../test/test-words";

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
 * Check if the input data is correct
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value (use getCurrentInput(), not input element value)
 * @param options.targetWord - Target word
 * @param options.correctShiftUsed - Whether the correct shift state was used. Null means disabled
 */
export function isWordCorrect(options: {
  data: string;
  inputValue: string;
  targetWord: string;
  correctShiftUsed: boolean | null; //null means disabled
}): boolean {
  const { data, inputValue, targetWord, correctShiftUsed } = options;

  if (Config.mode === "zen") return true;
  if (correctShiftUsed === false) return false;

  const finalInputValue = inputValue + (isSpace(data) ? "" : data);
  return finalInputValue === targetWord;
}

/**
 * Determines if a space character should be inserted as a character, or act
 * as a "control character" (moving to the next word)
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value (use getCurrentInput(), not input element value)
 * @param options.targetWord - Target word
 * @returns Boolean if data is space, null if not
 */
export function isJumpToNextWordBlocked(options: {
  data: string;
  inputValue: string;
  targetWord: string;
}): boolean {
  const { data, inputValue } = options;

  const correct = isWordCorrect({ ...options, correctShiftUsed: null });

  const stopOnErrorLetterAndIncorrect =
    Config.stopOnError === "letter" && !correct;
  const stopOnErrorWordAndIncorrect = Config.stopOnError === "word" && !correct;
  const strictSpace =
    isSpace(data) &&
    inputValue.length === 0 &&
    (Config.strictSpace || Config.difficulty !== "normal");
  return (
    stopOnErrorLetterAndIncorrect || stopOnErrorWordAndIncorrect || strictSpace
  );
}

export function shouldJumpToNextWord(options: {
  data: string;
  inputValue: string;
  targetWord: string;
  charIsSpace?: boolean;
  charIsNewline?: boolean;
}): boolean {
  const {
    data,
    inputValue,
    targetWord,
    charIsSpace = isSpace(data),
    charIsNewline = data === "\n",
  } = options;
  const isNextWordBlocked = isJumpToNextWordBlocked({
    data,
    inputValue,
    targetWord,
  });
  const noSpaceForce =
    isFunboxActiveWithProperty("nospace") &&
    (inputValue + data).length === TestWords.words.getCurrentText().length;
  return (charIsSpace || charIsNewline || noSpaceForce) && !isNextWordBlocked;
}
