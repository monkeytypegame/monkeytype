import { Config } from "../../config/store";
import { whorf } from "../../utils/misc";
import { type CommitCharacterType } from "./util";

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
 * @param options.data - The text data to be inserted
 * @param options.testInput - Current test input result (before adding data)
 * @param options.targetWord - Current target word
 * @param options.correct - Whether the input is correct
 * @param options.commitCharacterType - Type of the commit character, false if not a commit character
 */
export function checkIfFailedDueToDifficulty(options: {
  data: string;
  testInput: string;
  targetWord: string;
  correct: boolean;
  commitCharacterType: CommitCharacterType | false;
}): boolean {
  const { data, testInput, targetWord, correct, commitCharacterType } = options;
  // Using space or newline instead of shouldInsertSpace or increasedWordIndex
  // because we want expert mode to fail no matter if confidence or stop on error is on

  if (Config.mode === "zen") return false;

  const shouldFailDueToExpert =
    Config.difficulty === "expert" &&
    commitCharacterType !== false &&
    // a leading separator (empty input) commits nothing and must not fail;
    // a nospace commit (e.g. a 1-letter word) does commit on empty input
    !(commitCharacterType === "separator" && testInput.length === 0) &&
    testInput + data !== targetWord;

  const shouldFailDueToMaster = Config.difficulty === "master" && !correct;

  if (shouldFailDueToExpert || shouldFailDueToMaster) {
    return true;
  }
  return false;
}

/**
 * Determines if the test should finish
 * @param options - Options object
 * @param options.goingToNextWord - Is this input committing the word and moving on
 * @param options.testInputWithData - Current test input result (after adding data)
 * @param options.currentWord - Current target word
 * @param options.allWordsTyped - Have all words been typed
 * @returns Boolean if test should finish
 */
export function checkIfFinished(options: {
  goingToNextWord: boolean;
  testInputWithData: string;
  currentWord: string;
  allWordsTyped: boolean;
  allWordsGenerated: boolean;
}): boolean {
  const {
    goingToNextWord,
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
    (wordIsCorrect || shouldQuickEnd || goingToNextWord)
  ) {
    return true;
  }
  return false;
}
