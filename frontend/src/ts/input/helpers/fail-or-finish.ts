import Config from "../../config";
import { whorf } from "../../utils/misc";
import { areAllTestWordsGenerated } from "../../test/test-logic";

/**
 * Check if the test should fail due to minimum burst settings
 * @param options - Options object
 * @param options.testInputResult - Current test input result (after adding data)
 * @param options.currentWord - Current target word
 * @param options.lastBurst - Burst speed in WPM
 */
export function checkIfFailedDueToMinBurst(options: {
  testInputResult: string;
  currentWord: string;
  lastBurst: number | null;
}): boolean {
  const { testInputResult, currentWord, lastBurst } = options;
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
 * @param options - Options object
 * @param options.testInputResult - Current test input result (after adding data)
 * @param options.correct - Was the last input correct
 * @param options.spaceOrNewline - Is the input a space or newline
 */
export function checkIfFailedDueToDifficulty(options: {
  testInputResult: string;
  correct: boolean;
  spaceOrNewline: boolean;
}): boolean {
  const { testInputResult, correct, spaceOrNewline } = options;
  // Using space or newline instead of shouldInsertSpace or increasedWordIndex
  // because we want expert mode to fail no matter if confidence or stop on error is on

  if (Config.mode === "zen") return false;

  const shouldFailDueToExpert =
    Config.difficulty === "expert" &&
    !correct &&
    spaceOrNewline &&
    testInputResult.length > 1;

  const shouldFailDueToMaster = Config.difficulty === "master" && !correct;

  if (shouldFailDueToExpert || shouldFailDueToMaster) {
    return true;
  }
  return false;
}

/**
 * Determines if the test should finish
 * @param options - Options object
 * @param options.shouldGoToNextWord - Should go to next word
 * @param options.testInputResult - Current test input result (after adding data)
 * @param options.currentWord - Current target word
 * @param options.allWordsTyped - Have all words been typed
 * @returns Boolean if test should finish
 */
export function checkIfFinished(options: {
  shouldGoToNextWord: boolean;
  testInputResult: string;
  currentWord: string;
  allWordsTyped: boolean;
}): boolean {
  const { shouldGoToNextWord, testInputResult, currentWord, allWordsTyped } =
    options;
  const allWordGenerated = areAllTestWordsGenerated();
  const wordIsCorrect = testInputResult === currentWord;
  const shouldQuickEnd =
    Config.quickEnd &&
    currentWord.length === testInputResult.length &&
    Config.stopOnError === "off";
  if (
    allWordsTyped &&
    allWordGenerated &&
    (wordIsCorrect || shouldQuickEnd || shouldGoToNextWord)
  ) {
    return true;
  }
  return false;
}
