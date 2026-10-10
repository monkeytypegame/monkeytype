import { Config } from "../../config/store";
import * as TestUI from "../../test/test-ui";
import * as PaceCaret from "../../test/pace-caret";
import {
  decreaseActiveWordIndex,
  getActiveWordIndex,
  increaseActiveWordIndex,
} from "../../states/test";
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
  now: number;
};

type GoToNextWordReturn = {
  increasedWordIndex: boolean;
  lastBurst: number | null;
};

export async function goToNextWord({
  correctInsert,
  now,
}: GoToNextWordParams): Promise<GoToNextWordReturn> {
  const ret: GoToNextWordReturn = {
    increasedWordIndex: false,
    lastBurst: null,
  };

  TestUI.beforeTestWordChange("forward", correctInsert);

  for (const fb of getActiveFunboxesWithFunction("handleSpace")) {
    fb.functions.handleSpace();
  }

  if (Config.minBurst !== "off" || Config.liveBurstStyle !== "off") {
    const burst = getWordBurst(buildEventLog(), getActiveWordIndex(), now);
    ret.lastBurst = burst;
  }

  PaceCaret.handleSpace(
    correctInsert,
    TestWords.words.getCurrent()?.textWithCommit ?? "",
  );

  const nextWord = TestWords.words.get(getActiveWordIndex() + 1)?.text;
  if (nextWord !== undefined) Funbox.toggleScript(nextWord);

  const lastWord = getActiveWordIndex() >= TestWords.words.length - 1;
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
    getActiveWordIndex() < TestWords.words.length - 1 ||
    Config.mode === "zen"
  ) {
    ret.increasedWordIndex = true;
    increaseActiveWordIndex();
  }

  setInputElementValue("");
  void TestUI.afterTestWordChange("forward", ret.lastBurst);

  return ret;
}

export function goToPreviousWord(inputType: DeleteInputType): void {
  if (getActiveWordIndex() === 0) {
    setInputElementValue("");
    return;
  }

  TestUI.beforeTestWordChange("back", null);

  decreaseActiveWordIndex();

  const word = TestWords.words.get(getActiveWordIndex())?.text;
  if (word !== undefined) Funbox.toggleScript(word);

  const nospaceEnabled = isFunboxActiveWithProperty("nospace");

  if (inputType === "deleteWordBackward") {
    setInputElementValue("");
  } else if (inputType === "deleteContentBackward") {
    const word = getInputForWord(getActiveWordIndex());
    if (nospaceEnabled) {
      // nospace has no separator, so the prior word's commit was its last
      // letter; a single backspace deletes that letter (same as non-nospace
      // deletes the separator below)
      setInputElementValue(word.slice(0, -1));
    } else if (word.endsWith("\n") || word.endsWith(" ")) {
      setInputElementValue(word.slice(0, -1));
    } else {
      setInputElementValue(word);
    }
  }
  void TestUI.afterTestWordChange("back");
}
