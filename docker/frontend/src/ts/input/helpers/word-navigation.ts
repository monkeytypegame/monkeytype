import Config from "../../config";
import * as TestInput from "../../test/test-input";
import * as TestUI from "../../test/test-ui";
import * as PaceCaret from "../../test/pace-caret";
import * as TestState from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import * as TestWords from "../../test/test-words";
import {
  getActiveFunboxesWithFunction,
  isFunboxActiveWithProperty,
} from "../../test/funbox/list";
import * as TestStats from "../../test/test-stats";
import * as Replay from "../../test/replay";
import * as Funbox from "../../test/funbox/funbox";
import * as Loader from "../../elements/loader";
import { setInputElementValue } from "../input-element";
import { setAwaitingNextWord } from "../state";
import { DeleteInputType } from "./input-type";

type GoToNextWordParams = {
  correctInsert: boolean;
  // this is used to tell test ui to update the word before moving to the next word (in case of a composition that ends with a space)
  isCompositionEnding: boolean;
  zenNewline?: boolean;
};

type GoToNextWordReturn = {
  increasedWordIndex: boolean;
  lastBurst: number;
};

export async function goToNextWord({
  correctInsert,
  isCompositionEnding,
  zenNewline,
}: GoToNextWordParams): Promise<GoToNextWordReturn> {
  const ret = {
    increasedWordIndex: false,
    lastBurst: 0,
  };

  TestUI.beforeTestWordChange(
    "forward",
    correctInsert,
    isCompositionEnding || zenNewline === true,
  );

  if (correctInsert) {
    Replay.addReplayEvent("submitCorrectWord");
  } else {
    Replay.addReplayEvent("submitErrorWord");
  }

  for (const fb of getActiveFunboxesWithFunction("handleSpace")) {
    fb.functions.handleSpace();
  }

  //burst calculation and fail
  const burst: number = TestStats.calculateBurst();
  TestInput.pushBurstToHistory(burst);
  ret.lastBurst = burst;

  PaceCaret.handleSpace(correctInsert, TestWords.words.getCurrent());

  Funbox.toggleScript(TestWords.words.get(TestState.activeWordIndex + 1));

  TestInput.input.pushHistory();
  TestInput.corrected.pushHistory();

  const lastWord = TestState.activeWordIndex >= TestWords.words.length - 1;
  if (lastWord) {
    setAwaitingNextWord(true);
    Loader.show();
    await TestLogic.addWord();
    Loader.hide();
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
  TestInput.input.syncWithInputElement();
  void TestUI.afterTestWordChange("forward");

  return ret;
}

export function goToPreviousWord(
  inputType: DeleteInputType,
  forceUpdateActiveWordLetters = false,
): void {
  if (TestState.activeWordIndex === 0) {
    setInputElementValue("");
    TestInput.input.syncWithInputElement();
    return;
  }

  TestUI.beforeTestWordChange("back", null, forceUpdateActiveWordLetters);

  Replay.addReplayEvent("backWord");

  const word = TestInput.input.popHistory();
  TestState.decreaseActiveWordIndex();
  TestInput.corrected.popHistory();

  Funbox.toggleScript(TestWords.words.get(TestState.activeWordIndex));

  const nospaceEnabled = isFunboxActiveWithProperty("nospace");

  if (inputType === "deleteWordBackward") {
    setInputElementValue("");
  } else if (inputType === "deleteContentBackward") {
    if (nospaceEnabled) {
      setInputElementValue(word.slice(0, -1));
    } else if (word.endsWith("\n")) {
      setInputElementValue(word.slice(0, -1));
    } else {
      setInputElementValue(word);
    }
  }
  TestInput.input.syncWithInputElement();

  void TestUI.afterTestWordChange("back");
}
