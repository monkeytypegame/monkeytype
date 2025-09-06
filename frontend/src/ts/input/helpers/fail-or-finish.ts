import Config from "../../config";
import * as TestWords from "../../test/test-words";
import * as TestState from "../../test/test-state";
import * as TestInput from "../../test/test-input";
import { whorf } from "../../utils/misc";
import * as TestLogic from "../../test/test-logic";

export function checkIfFailedDueToMinBurst(lastBurst: number | null): boolean {
  if (Config.minBurst !== "off" && lastBurst !== null) {
    let wordLength: number;
    if (Config.mode === "zen") {
      wordLength = TestInput.input.current.length;
    } else {
      wordLength = TestWords.words.getCurrent().length;
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

// Using space or newline instead of shouldInsertSapce or increasedWordIndex
// because we want expert mode to fail no matter if confidence or stop on error is on
export function checkIfFailedDueToDifficulty(spaceOrNewLine: boolean): boolean {
  const correctSoFar = TestWords.words
    .getCurrent()
    .startsWith(TestInput.input.current);

  const shouldFailDueToExpert =
    Config.difficulty === "expert" && !correctSoFar && spaceOrNewLine;

  const shouldFailDueToMaster = Config.difficulty === "master" && !correctSoFar;

  if (shouldFailDueToExpert || shouldFailDueToMaster) {
    return true;
  }
  return false;
}

export function checkIfFinished(
  shouldGoToNextWord: boolean,
  spaceIncreasedIndex: boolean | null
): boolean {
  const allWordsTyped = TestState.activeWordIndex >= TestWords.words.length - 1;
  const spaceOnLastWord = shouldGoToNextWord && !spaceIncreasedIndex;
  const currentWord = TestWords.words.getCurrent();
  const allWordGenerated = TestLogic.areAllTestWordsGenerated();
  const wordIsCorrect =
    TestInput.input.current === TestWords.words.get(TestState.activeWordIndex);
  const shouldQuickEnd =
    Config.quickEnd &&
    currentWord.length === TestInput.input.current.length &&
    Config.stopOnError === "off";
  if (
    allWordsTyped &&
    allWordGenerated &&
    (wordIsCorrect || shouldQuickEnd || spaceOnLastWord)
  ) {
    return true;
  }
  return false;
}
