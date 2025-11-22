import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import * as TestInput from "../../test/test-input";
import { getInputValue, setInputValue } from "../core/input-element";

import * as Replay from "../../test/replay";
import Config from "../../config";
import { goToPreviousWord } from "../helpers/word-navigation";
import { DeleteInputType } from "../helpers/input-type";

export function onDelete(inputType: DeleteInputType): void {
  const { realInputValue } = getInputValue();

  const inputBeforeDelete = TestInput.input.current;

  TestInput.input.syncWithInputElement();

  Replay.addReplayEvent("setLetterIndex", TestInput.input.current.length);
  TestInput.setCurrentNotAfk();

  const beforeDeleteOnlyTabs = /^\t*$/.test(inputBeforeDelete);
  const allTabsCorrect = TestWords.words
    .getCurrent()
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
    setInputValue("");
    TestInput.input.syncWithInputElement();
    goToPreviousWord(inputType, true);
  } else {
    //normal backspace
    if (realInputValue === "") {
      goToPreviousWord(inputType);
    }
  }

  TestUI.afterTestDelete();
}
