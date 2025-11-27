import Config from "../../config";
import * as TestInput from "../../test/test-input";
import * as TestState from "../../test/test-state";
import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import { isFunboxActiveWithProperty } from "../../test/funbox/list";
import { isSpace } from "../../utils/strings";
import { getInputElementValue } from "../input-element";
import { isAwaitingNextWord } from "../state";
import { shouldInsertSpaceCharacter } from "../helpers/validation";

/**
 * Handles logic before inserting text into the input element.
 * @param data - The text data to be inserted.
 * @returns Whether to prevent the default insertion behavior.
 */
export function onBeforeInsertText(data: string): boolean {
  if (TestState.testRestarting) {
    return true;
  }

  if (isAwaitingNextWord()) {
    return true;
  }

  if (TestUI.resultCalculating) {
    return true;
  }

  const { inputValue } = getInputElementValue();
  const dataIsSpace = isSpace(data);
  const shouldInsertSpaceAsCharacter = shouldInsertSpaceCharacter({
    data,
    inputValue,
    targetWord: TestWords.words.getCurrent(),
  });

  //prevent space from being inserted if input is empty
  //allow if strict space is enabled
  if (
    dataIsSpace &&
    inputValue === "" &&
    Config.difficulty === "normal" &&
    !Config.strictSpace
  ) {
    return true;
  }

  //prevent space in nospace funbox
  if (dataIsSpace && isFunboxActiveWithProperty("nospace")) {
    return true;
  }

  //only allow newlines if the test has newlines or in zen mode
  if (data === "\n" && !TestWords.hasNewline && Config.mode !== "zen") {
    return true;
  }

  // block input if the word is too long
  const inputLimit =
    Config.mode === "zen" ? 30 : TestWords.words.getCurrent().length + 20;
  const overLimit = TestInput.input.current.length >= inputLimit;
  if (overLimit && (shouldInsertSpaceAsCharacter === true || !dataIsSpace)) {
    console.error("Hitting word limit");
    return true;
  }

  // prevent the word from jumping to the next line if the word is too long
  // this will not work for the first word of each line, but that has a low chance of happening
  const dataIsNotFalsy = data !== null && data !== "";
  const inputIsLongerThanOrEqualToWord =
    TestInput.input.current.length >= TestWords.words.getCurrent().length;

  if (
    dataIsNotFalsy &&
    !Config.blindMode &&
    !Config.hideExtraLetters &&
    inputIsLongerThanOrEqualToWord &&
    (shouldInsertSpaceAsCharacter === true || !dataIsSpace) &&
    Config.mode !== "zen"
  ) {
    // make sure to only check this when really necessary
    // because this check is expensive (causes layout reflows)
    const topAfterAppend = TestUI.getActiveWordTopAfterAppend(data);
    const wordJumped = topAfterAppend > TestUI.activeWordTop;
    if (wordJumped) {
      return true;
    }
  }

  return false;
}
