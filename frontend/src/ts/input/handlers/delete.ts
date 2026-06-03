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

  const inputAfterDelete = TestInput.input.current;

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
  ) {
    // Clear N+1's tabs (the word the user was in)
    logTestEvent("input", now, {
      inputType: "deleteWordBackward",
      wordIndex: activeWordIndexBeforeDelete,
      charIndex: inputBeforeDelete.length,
      inputValue: "",
    });

    setInputElementValue("");
    goToPreviousWord(inputType, true);

    // Record the resulting state of the previous word (newline removed)
    const postNavInputValue = getInputElementValue().inputValue;
    logTestEvent("input", now, {
      inputType: "deleteContentBackward",
      wordIndex: activeWordIndex,
      charIndex: postNavInputValue.length,
      inputValue: postNavInputValue,
    });

    TestUI.afterTestDelete();
    return;
  }

  //normal backspace
  if (realInputValue === "") {
    goToPreviousWord(inputType);

    // Record the resulting state of the destination word
    const postNavInputValue = getInputElementValue().inputValue;
    logTestEvent("input", now, {
      inputType: inputType,
      wordIndex: activeWordIndex,
      charIndex: postNavInputValue.length,
      inputValue: postNavInputValue,
    });
  } else {
    // Delete within current word
    logTestEvent("input", now, {
      inputType: inputType,
      wordIndex: activeWordIndexBeforeDelete,
      charIndex: inputBeforeDelete.length,
      inputValue: inputAfterDelete,
    });
  }

  TestUI.afterTestDelete();
}
