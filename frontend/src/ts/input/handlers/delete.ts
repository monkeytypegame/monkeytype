import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import * as TestInput from "../../test/test-input";
import { getInputElementValue, setInputElementValue } from "../input-element";

import * as Replay from "../../test/replay";
import { Config } from "../../config/store";
import { goToPreviousWord } from "../helpers/word-navigation";
import { DeleteInputType } from "../helpers/input-type";
import { logTestEvent } from "../../test/events/data";
import { activeWordIndex } from "../../test/test-state";

export function onDelete(inputType: DeleteInputType, now: number): void {
  const { realInputValue } = getInputElementValue();

  const inputBeforeDelete = TestInput.input.current;
  const activeWordIndexBeforeDelete = activeWordIndex;

  TestInput.input.syncWithInputElement();

  Replay.addReplayEvent("setLetterIndex", TestInput.input.current.length);
  TestInput.setCurrentNotAfk();

  const beforeDeleteOnlyTabs = /^\t*$/.test(inputBeforeDelete);
  const allTabsCorrect = TestWords.words
    .getCurrentText()
    .startsWith(TestInput.input.current);

  //special check for code languages
  if (
    Config.language.startsWith("code") &&
    Config.codeUnindentOnBackspace &&
    inputBeforeDelete.length > 0 &&
    beforeDeleteOnlyTabs &&
    allTabsCorrect
    // (TestInput.input.getHistory(TestState.activeWordIndex - 1) !==
    //   TestWords.words.get(TestState.activeWordIndex - 1) ||
    //   Config.freedomMode)
  ) {
    setInputElementValue("");
    TestInput.input.syncWithInputElement();
    goToPreviousWord(inputType, true);
  } else {
    //normal backspace
    if (realInputValue === "") {
      goToPreviousWord(inputType);
    }
  }

  logTestEvent("input", now, {
    inputType: inputType,
    wordIndex: activeWordIndexBeforeDelete,
    charIndex: inputBeforeDelete.length,
  });

  TestUI.afterTestDelete();
}
