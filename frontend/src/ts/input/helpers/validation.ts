import { Config } from "../../config/store";
import { isSpace } from "../../utils/strings";

/**
 * Check if a character or a word are always correct/incorrect, used by isCharCorrect
 * and isWordCorrect.
 * @param correctShiftUsed - Whether the correct shift state was used. Null means disabled
 */
function isCharOrWordAlwaysCorrectOrIncorrect(
  correctShiftUsed: boolean | null,
): boolean | null {
  if (Config.mode === "zen") return true;
  if (correctShiftUsed === false) return false;
  return null;
}

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

  const isCharAlwaysCorrectOrIncorrect =
    isCharOrWordAlwaysCorrectOrIncorrect(correctShiftUsed);
  if (isCharAlwaysCorrectOrIncorrect !== null) {
    return isCharAlwaysCorrectOrIncorrect;
  }

  if (data === undefined) {
    throw new Error("Failed to check if char is correct - data is undefined");
  }

  const targetChar = targetWord[inputValue.length];

  if (targetChar === undefined) {
    return false;
  }

  return data === targetChar;
}

/**
 * Check if the input data is correct
 * @param options - Options object
 * @param options.inputValue - Current input value (use getCurrentInput(), not input element value)
 * @param options.targetWord - Target word
 * @param options.correctShiftUsed - Whether the correct shift state was used. Null means disabled
 */
export function isWordCorrect(options: {
  inputValue: string;
  targetWord: string;
  correctShiftUsed: boolean | null; //null means disabled
}): boolean {
  const { inputValue, targetWord, correctShiftUsed } = options;

  const isCharAlwaysCorrectOrIncorrect =
    isCharOrWordAlwaysCorrectOrIncorrect(correctShiftUsed);
  if (isCharAlwaysCorrectOrIncorrect !== null) {
    return isCharAlwaysCorrectOrIncorrect;
  }

  return inputValue === targetWord;
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
export function shouldInsertSpaceCharacter(options: {
  data: string;
  inputValue: string;
  targetWord: string;
}): boolean | null {
  const { data, inputValue, targetWord } = options;
  if (!isSpace(data)) {
    return null;
  }
  if (Config.mode === "zen") {
    return false;
  }
  const correctSoFar = `${targetWord} `.startsWith(`${inputValue} `);
  const stopOnErrorLetterAndIncorrect =
    Config.stopOnError === "letter" && !correctSoFar;
  const stopOnErrorWordAndIncorrect =
    Config.stopOnError === "word" && !correctSoFar;
  const strictSpace =
    inputValue.length === 0 &&
    (Config.strictSpace || Config.difficulty !== "normal");
  return (
    stopOnErrorLetterAndIncorrect || stopOnErrorWordAndIncorrect || strictSpace
  );
}
