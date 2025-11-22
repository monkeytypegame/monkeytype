import Config from "../../config";
import { whorf } from "../../utils/misc";

/**
 * Check if the test should fail due to minimum burst settings
 * @param options - Options object
 * @param options.testInputWithData - Current test input result (after adding data)
 * @param options.currentWord - Current target word
 * @param options.lastBurst - Burst speed in WPM
 */
export function checkIfFailedDueToMinBurst(options: {
  testInputWithData: string;
  currentWord: string;
  lastBurst: number | null;
}): boolean {
  const { testInputWithData, currentWord, lastBurst } = options;
  if (Config.minBurst !== "off" && lastBurst !== null) {
    let wordLength: number;
    if (Config.mode === "zen") {
      wordLength = testInputWithData.length;
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
 * @param options.testInputWithData - Current test input result (after adding data)
 * @param options.correct - Was the last input correct
 * @param options.spaceOrNewline - Is the input a space or newline
 */
export function checkIfFailedDueToDifficulty(options: {
  testInputWithData: string;
  correct: boolean;
  spaceOrNewline: boolean;
}): boolean {
  const { testInputWithData, correct, spaceOrNewline } = options;
  // Using space or newline instead of shouldInsertSpace or increasedWordIndex
  // because we want expert mode to fail no matter if confidence or stop on error is on

  if (Config.mode === "zen") return false;

  const shouldFailDueToExpert =
    Config.difficulty === "expert" &&
    !correct &&
    spaceOrNewline &&
    testInputWithData.length > 1;

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
 * @param options.testInputWithData - Current test input result (after adding data)
 * @param options.currentWord - Current target word
 * @param options.allWordsTyped - Have all words been typed
 * @returns Boolean if test should finish
 */
export function checkIfFinished(options: {
  shouldGoToNextWord: boolean;
  testInputWithData: string;
  currentWord: string;
  allWordsTyped: boolean;
  allWordsGenerated: boolean;
}): boolean {
  const {
    shouldGoToNextWord,
    testInputWithData,
    currentWord,
    allWordsTyped,
    allWordsGenerated,
  } = options;
  const wordIsCorrect = testInputWithData === currentWord;
  const shouldQuickEnd =
    Config.quickEnd &&
    currentWord.length === testInputWithData.length &&
    Config.stopOnError === "off";
  if (
    allWordsTyped &&
    allWordsGenerated &&
    (wordIsCorrect || shouldQuickEnd || shouldGoToNextWord)
  ) {
    return true;
  }
  return false;
}
