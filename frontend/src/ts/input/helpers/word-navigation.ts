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
import * as LiveBurst from "../../test/live-burst";
import * as Funbox from "../../test/funbox/funbox";
import * as Loader from "../../elements/loader";
import { setInputValue } from "../core/input-element";
import { setAwaitingNextWord } from "../core/state";
import { DeleteInputType } from "./input-type";

type GoToNextWordParams = {
  correctInsert: boolean;
};

type GoToNextWordReturn = {
  increasedWordIndex: boolean;
  lastBurst: number;
};

export async function goToNextWord({
  correctInsert,
}: GoToNextWordParams): Promise<GoToNextWordReturn> {
  const ret = {
    increasedWordIndex: false,
    lastBurst: 0,
  };

  TestUI.beforeTestWordChange("forward", correctInsert);

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
  void LiveBurst.update(Math.round(burst));
  TestInput.pushBurstToHistory(burst);
  ret.lastBurst = burst;

  PaceCaret.handleSpace(correctInsert, TestWords.words.getCurrent());

  Funbox.toggleScript(TestWords.words.get(TestState.activeWordIndex + 1));

  const lastWord = TestState.activeWordIndex >= TestWords.words.length - 1;
  if (lastWord) {
    setAwaitingNextWord(true);
    Loader.show();
    await TestLogic.addWord();
    Loader.hide();
    setAwaitingNextWord(false);
  } else {
    await TestLogic.addWord();
  }
  TestInput.input.pushHistory();
  TestInput.corrected.pushHistory();
  if (
    TestState.activeWordIndex < TestWords.words.length - 1 ||
    Config.mode === "zen"
  ) {
    ret.increasedWordIndex = true;
    TestState.increaseActiveWordIndex();
  }

  setInputValue("");
  TestUI.afterTestWordChange("forward");

  return ret;
}

export function goToPreviousWord(inputType: DeleteInputType): void {
  if (TestState.activeWordIndex === 0) {
    setInputValue("");
    return;
  }

  TestUI.beforeTestWordChange("back", null);

  Replay.addReplayEvent("backWord");

  const word = TestInput.input.popHistory();
  TestState.decreaseActiveWordIndex();
  TestInput.corrected.popHistory();

  Funbox.toggleScript(TestWords.words.get(TestState.activeWordIndex));

  const nospaceEnabled = isFunboxActiveWithProperty("nospace");

  if (inputType === "deleteWordBackward") {
    setInputValue("");
  } else if (inputType === "deleteContentBackward") {
    if (nospaceEnabled) {
      setInputValue(word.slice(0, -1));
    } else if (word.endsWith("\n")) {
      setInputValue(word.slice(0, -1));
    } else {
      setInputValue(word);
    }
  }
  TestUI.afterTestWordChange("back");
}
