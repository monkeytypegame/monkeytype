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

export function checkIfFailedDueToDifficulty(
  correctInsert: boolean,
  shouldInsertSpace: boolean,
  wentToNextWord: boolean
): boolean {
  const shouldFailDueToExpert =
    Config.difficulty === "expert" &&
    !correctInsert &&
    (shouldInsertSpace || wentToNextWord);

  const shouldFailDueToMaster =
    Config.difficulty === "master" && !correctInsert;

  if (shouldFailDueToExpert || shouldFailDueToMaster) {
    return true;
  }
  return false;
}

export function checkIfFinished(
  spaceIncreasedIndex: boolean | null,
  wentToNextWord: boolean
): boolean {
  const allWordsTyped = TestState.activeWordIndex >= TestWords.words.length - 1;
  const spaceOnLastWord = wentToNextWord && !spaceIncreasedIndex;
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
