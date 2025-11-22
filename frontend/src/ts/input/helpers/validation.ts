import Config from "../../config";
import { findSingleActiveFunboxWithFunction } from "../../test/funbox/list";
import { areCharactersVisuallyEqual, isSpace } from "../../utils/strings";

/**
 * Check if the input data is correct
 * @param data - Input data
 * @param inputValue - Current input value (use TestInput.input.current, not input element value)
 * @param correctShiftUsed - Whether the correct shift state was used. Null means disabled
 */
export function isCharCorrect(
  data: string,
  inputValue: string,
  targetWord: string,
  correctShiftUsed: boolean | null //null means disabled
): boolean {
  if (Config.mode === "zen") return true;

  if (correctShiftUsed === false) return false;

  if (data === undefined) {
    throw new Error("Failed to check if char is correct - data is undefined");
  }

  if (data === " ") {
    return inputValue === targetWord;
  }

  const targetChar = targetWord[inputValue.length];

  if (targetChar === undefined) {
    return false;
  }

  if (data === targetChar) {
    return true;
  }

  const funbox = findSingleActiveFunboxWithFunction("isCharCorrect");
  if (funbox) {
    return funbox.functions.isCharCorrect(data, targetChar);
  }

  if (Config.language.startsWith("russian")) {
    if (
      (data === "ё" || data === "е" || data === "e") &&
      (targetChar === "ё" || targetChar === "е" || targetChar === "e")
    ) {
      return true;
    }
  }

  const visuallyEqual = areCharactersVisuallyEqual(data, targetChar);
  if (visuallyEqual) {
    return true;
  }

  return false;
}

/**
 * Determines if a space character should be inserted as a character, or act
 * as a "control character" (moving to the next word)
 * @param data - Input data
 * @param inputValue - Current input value (use TestInput.input.current, not input element value)
 * @returns Boolean if data is space, null if not
 */
export function shouldInsertSpaceCharacter(
  data: string,
  inputValue: string,
  targetWord: string
): boolean | null {
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
