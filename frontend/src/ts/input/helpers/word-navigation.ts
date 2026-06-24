import { Config } from "../../config/store";
import * as TestUI from "../../test/test-ui";
import * as PaceCaret from "../../test/pace-caret";
import * as TestState from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import * as TestWords from "../../test/test-words";
import {
  getActiveFunboxesWithFunction,
  isFunboxActiveWithProperty,
} from "../../test/funbox/list";
import * as Funbox from "../../test/funbox/funbox";
import { showLoaderBar, hideLoaderBar } from "../../states/loader-bar";
import { setInputElementValue } from "../input-element";
import { setAwaitingNextWord } from "../state";
import { DeleteInputType } from "./input-type";
import { getWordBurst } from "../../test/events/stats";
import { buildEventLog, getInputForWord } from "../../test/events/data";

type GoToNextWordParams = {
  correctInsert: boolean;
  // this is used to tell test ui to update the word before moving to the next word (in case of a composition that ends with a space)
  isCompositionEnding: boolean;
  zenNewline?: boolean;
  now: number;
};

type GoToNextWordReturn = {
  increasedWordIndex: boolean;
  lastBurst: number | null;
};

export async function goToNextWord({
  correctInsert,
  isCompositionEnding,
  zenNewline,
  now,
}: GoToNextWordParams): Promise<GoToNextWordReturn> {
  const ret: GoToNextWordReturn = {
    increasedWordIndex: false,
    lastBurst: null,
  };

  TestUI.beforeTestWordChange(
    "forward",
    correctInsert,
    isCompositionEnding || zenNewline === true,
  );

  for (const fb of getActiveFunboxesWithFunction("handleSpace")) {
    fb.functions.handleSpace();
  }

  if (Config.minBurst !== "off" || Config.liveBurstStyle !== "off") {
    const burst = getWordBurst(buildEventLog(), TestState.activeWordIndex, now);
    ret.lastBurst = burst;
  }

  PaceCaret.handleSpace(correctInsert, TestWords.words.getCurrentText());

  Funbox.toggleScript(
    TestWords.words.getText(TestState.activeWordIndex + 1) ?? "",
  );

  const lastWord = TestState.activeWordIndex >= TestWords.words.length - 1;
  if (lastWord) {
    setAwaitingNextWord(true);
    showLoaderBar();
    await TestLogic.addWord();
    hideLoaderBar();
    setAwaitingNextWord(false);
  } else {
    void TestLogic.addWord();
  }

  if (
    TestState.activeWordIndex < TestWords.words.length - 1 ||
    Config.mode === "zen"
  ) {
    ret.increasedWordIndex = true;
    TestState.increaseActiveWordIndex();
  }

  setInputElementValue("");
  void TestUI.afterTestWordChange("forward", ret.lastBurst);

  return ret;
}

export function goToPreviousWord(
  inputType: DeleteInputType,
  forceUpdateActiveWordLetters = false,
): void {
  if (TestState.activeWordIndex === 0) {
    setInputElementValue("");
    return;
  }

  TestUI.beforeTestWordChange("back", null, forceUpdateActiveWordLetters);

  TestState.decreaseActiveWordIndex();

  const word = TestWords.words.getText(TestState.activeWordIndex);
  if (word !== undefined) Funbox.toggleScript(word);

  const nospaceEnabled = isFunboxActiveWithProperty("nospace");

  if (inputType === "deleteWordBackward") {
    setInputElementValue("");
  } else if (inputType === "deleteContentBackward") {
    const word = getInputForWord(TestState.activeWordIndex);
    if (nospaceEnabled) {
      setInputElementValue(word.slice(0, -1));
    } else if (word.endsWith("\n")) {
      setInputElementValue(word.slice(0, -1));
    } else {
      setInputElementValue(word);
    }
  }
  void TestUI.afterTestWordChange("back");
}
