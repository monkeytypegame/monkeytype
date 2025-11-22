import Config from "../../config";
import { whorf } from "../../utils/misc";
import * as TestLogic from "../../test/test-logic";
import { isSpace } from "../../utils/strings";

/**
 * Check if the test should fail due to minimum burst settings
 * @param testInputResult - Current test input result (after adding data)
 * @param currentWord - Current target word
 * @param lastBurst - Burst speed in WPM
 */
export function checkIfFailedDueToMinBurst(
  testInputResult: string,
  currentWord: string,
  lastBurst: number | null
): boolean {
  if (Config.minBurst !== "off" && lastBurst !== null) {
    let wordLength: number;
    if (Config.mode === "zen") {
      wordLength = testInputResult.length;
    } else {
      wordLength = currentWord.length;
    }

    const flex: number = whorf(Config.minBurstCustomSpeed, wordLength);
    if (
      (Config.minBurst === "fixed" && lastBurst < Config.minBurstCustomSpeed) ||
      (Config.minBurst === "flex" && lastBurst < flex)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Check if the test should fail due to difficulty settings
 * @param testInputResult - Current test input result (after adding data)
 * @param correct - Was the last input correct
 * @param spaceOrNewLine - Is the input a space or newline
 */
export function checkIfFailedDueToDifficulty(
  testInputResult: string,
  correct: boolean,
  spaceOrNewline: boolean
): boolean {
  // Using space or newline instead of shouldInsertSpace or increasedWordIndex
  // because we want expert mode to fail no matter if confidence or stop on error is on

  if (Config.mode === "zen") return false;

  const shouldFailDueToExpert =
    Config.difficulty === "expert" &&
    !correct &&
    spaceOrNewline &&
    testInputResult.length > 0;

  const shouldFailDueToMaster = Config.difficulty === "master" && !correct;

  if (shouldFailDueToExpert || shouldFailDueToMaster) {
    return true;
  }
  return false;
}

/**
 * Determines if the test should finish
 * @param data - Input data
 * @param testInputResult - Current test input result (after adding data)
 * @param currentWord - Current target word
 * @param allWordsTyped - Have all words been typed
 * @returns Boolean if test should finish
 */
export function checkIfFinished(
  data: string,
  testInputResult: string,
  currentWord: string,
  allWordsTyped: boolean
): boolean {
  const charIsSpace = isSpace(data);
  const allWordGenerated = TestLogic.areAllTestWordsGenerated();
  const wordIsCorrect = testInputResult === currentWord;
  const shouldQuickEnd =
    Config.quickEnd &&
    currentWord.length === testInputResult.length &&
    Config.stopOnError === "off";
  if (
    allWordsTyped &&
    allWordGenerated &&
    (wordIsCorrect || shouldQuickEnd || charIsSpace)
  ) {
    return true;
  }
  return false;
}
