import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import * as TestInput from "../../test/test-input";
import {
  getInputValue,
  setInputValue,
  setTestInputToDOMValue,
} from "../core/input-element";
import * as TestState from "../../test/test-state";
import * as Replay from "../../test/replay";
import Config from "../../config";
import { goToPreviousWord } from "../helpers/word-navigation";
import { SupportedInputType } from "../helpers/input-type";

export function onDelete(inputType: SupportedInputType): void {
  const { realInputValue } = getInputValue();

  setTestInputToDOMValue();

  Replay.addReplayEvent("setLetterIndex", TestInput.input.current.length);
  TestInput.setCurrentNotAfk();

  const onlyTabs = /^\t*$/.test(TestInput.input.current);
  const allTabsCorrect = TestWords.words
    .getCurrent()
    .startsWith(TestInput.input.current);

  //special check for code languages
  if (
    Config.language.startsWith("code") &&
    Config.codeUnindentOnBackspace &&
    onlyTabs &&
    allTabsCorrect
    // (TestInput.input.getHistory(TestState.activeWordIndex - 1) !==
    //   TestWords.words.get(TestState.activeWordIndex - 1) ||
    //   Config.freedomMode)
  ) {
    setInputValue("");
    goToPreviousWord(inputType);
  } else {
    //normal backspace
    if (realInputValue === "") {
      const isFirstVisibleWord =
        TestState.activeWordIndex - TestState.removedUIWordCount === 0;

      if (!isFirstVisibleWord) {
        goToPreviousWord(inputType);
      }
    }
  }

  TestUI.afterTestDelete();
}
