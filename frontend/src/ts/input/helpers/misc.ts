import Config from "../../config";
import * as TestWords from "../../test/test-words";
import * as TestState from "../../test/test-state";
import * as TestInput from "../../test/test-input";
import { whorf } from "../../utils/misc";
import * as TestLogic from "../../test/test-logic";
import { SupportedInputType } from "../core/types";

export function isIgnoredInputType(inputType: string): boolean {
  return [
    "insertReplacementText", //todo reconsider
    "insertParagraph",
    "insertOrderedList",
    "insertUnorderedList",
    "insertHorizontalRule",
    "insertFromYank",
    "insertFromDrop",
    "insertFromPaste",
    "insertFromPasteAsQuotation",
    "insertTranspose",
    "insertLink",
    "deleteSoftLineBackward",
    "deleteSoftLineForward",
    "deleteEntireSoftLine",
    "deleteHardLineBackward",
    "deleteHardLineForward",
    "deleteByDrag",
    "deleteByCut",
    "deleteContent", // might break things?
    "deleteContentForward",
    "history*",
    "format*",
  ].some((type) => {
    if (type.endsWith("*")) {
      return inputType.startsWith(type.slice(0, -1));
    } else {
      return inputType === type;
    }
  });
}

type FailOrFinishParams = {
  data: string;
  correctInsert: boolean;
  inputType: SupportedInputType;
  spaceIncreasedIndex: boolean | null;
  wentToNextWord: boolean;
  shouldInsertSpace: boolean;
  lastBurst: number | null;
};

export function failOrFinish({
  correctInsert,
  wentToNextWord,
  spaceIncreasedIndex,
  shouldInsertSpace,
  lastBurst,
}: FailOrFinishParams): void {
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
      TestLogic.fail("min burst");
      return;
    }
  }

  const shouldFailDueToExpert =
    Config.difficulty === "expert" &&
    !correctInsert &&
    (shouldInsertSpace || wentToNextWord);

  const shouldFailDueToMaster =
    Config.difficulty === "master" && !correctInsert;

  if (shouldFailDueToExpert || shouldFailDueToMaster) {
    TestLogic.fail("difficulty");
    return;
  }

  // if we went to the next word, shift the active index back
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
    void TestLogic.finish();
    return;
  }
}
