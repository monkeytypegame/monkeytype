import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import {
  getInputElement,
  getInputElementValue,
  setInputElementValue,
} from "../input-element";

import { Config } from "../../config/store";
import { goToPreviousWord } from "../helpers/word-navigation";
import { DeleteInputType } from "../helpers/input-type";
import {
  getCurrentInput,
  getInputForWord,
  logTestEvent,
} from "../../test/events/data";
import { getActiveWordIndex } from "../../states/test";
import { onBeforeDelete } from "./before-delete";

export function onDeleteLine(event: InputEvent, now: number): void {
  onBeforeDelete(event);
  if (event.defaultPrevented) return;

  const index = getActiveWordIndex();
  const input = getCurrentInput();
  const word = TestWords.words.getCurrent();
  if (
    input !== "" &&
    (input === word?.text || input === word?.textWithCommit)
  ) {
    return;
  }

  const lineTop = TestUI.getWordElement(index)?.getOffsetTop();
  if (lineTop === undefined) return;

  // Capture the boundary before removing typos can reflow the words.
  let firstWord = index;
  while (
    firstWord > 0 &&
    TestUI.getWordElement(firstWord - 1)?.getOffsetTop() === lineTop &&
    getInputForWord(firstWord - 1) !==
      TestWords.words.get(firstWord - 1)?.textWithCommit
  ) {
    firstWord--;
  }

  if (input !== "") {
    setInputElementValue("");
    logTestEvent("input", now, {
      inputType: "deleteWordBackward",
      wordIndex: index,
      charIndex: input.length,
      inputValue: "",
    });
    TestUI.afterTestDelete();
  }

  while (getActiveWordIndex() > firstWord) {
    onBeforeDelete(event);
    if (event.defaultPrevented) return;
    getInputElement().value = "";
    onDelete("deleteWordBackward", now);
  }
}

export function onDelete(inputType: DeleteInputType, now: number): void {
  const { realInputValue } = getInputElementValue();

  const inputBeforeDelete = getCurrentInput();
  const activeWordIndexBeforeDelete = getActiveWordIndex();

  const inputAfterDelete = getInputElementValue().inputValue;

  const beforeDeleteOnlyTabs = /^\t*$/.test(inputBeforeDelete);
  const allTabsCorrect = TestWords.words
    .getCurrent()
    ?.textWithCommit.startsWith(inputAfterDelete);

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
    goToPreviousWord(inputType);

    // Record the resulting state of the previous word (newline removed)
    const postNavInputValue = getInputElementValue().inputValue;
    logTestEvent("input", now, {
      inputType: "deleteContentBackward",
      wordIndex: getActiveWordIndex(),
      charIndex: postNavInputValue.length,
      inputValue: postNavInputValue,
    });

    TestUI.afterTestDelete();
    return;
  }

  //normal backspace
  if (realInputValue === "") {
    // if the input is NOT empty, that means the ctrl backspace deleted more than just the fake space (THANKS FIREFOX)
    // which means we need to force update the current word element when we move back
    goToPreviousWord(inputType);

    // Record the resulting state of the destination word
    const postNavInputValue = getInputElementValue().inputValue;
    logTestEvent("input", now, {
      inputType: inputType,
      wordIndex: getActiveWordIndex(),
      charIndex: postNavInputValue.length,
      inputValue: postNavInputValue,
      ...(inputBeforeDelete !== "" ? { clearedNextWord: true } : {}),
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
