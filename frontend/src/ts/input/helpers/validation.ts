import Config from "../../config";
import { isSpace } from "../../utils/strings";

/**
 * Check if the input data is correct
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value (use TestInput.input.current, not input element value)
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

  if (data === undefined) {
    throw new Error("Failed to check if char is correct - data is undefined");
  }

  if (isSpace(data)) {
    return inputValue === targetWord;
  }

  const targetChar = targetWord[inputValue.length];

  if (targetChar === undefined) {
    return false;
  }

  if (data === targetChar) {
    return true;
  }

  return false;
}

/**
 * Determines if a space character should be inserted as a character, or act
 * as a "control character" (moving to the next word)
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value (use TestInput.input.current, not input element value)
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
  const correctSoFar = (targetWord + " ").startsWith(inputValue + " ");
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
