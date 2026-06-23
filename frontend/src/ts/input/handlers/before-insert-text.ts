import { Config } from "../../config/store";
import { getCurrentInput } from "../../test/events/data";
import * as TestState from "../../test/test-state";
import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import { isFunboxActiveWithProperty } from "../../test/funbox/list";
import { isSpace } from "../../utils/strings";
import { getInputElementValue } from "../input-element";
import { isAwaitingNextWord } from "../state";
import { isJumpToNextWordBlocked } from "../helpers/validation";
import * as SlowTimer from "../../legacy-states/slow-timer";
import { wordsHaveNewline } from "../../states/test";

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

  if (TestState.resultCalculating) {
    return true;
  }

  const { inputValue } = getInputElementValue();
  const dataIsSpace = isSpace(data);
  const isNextWordBlocked = isJumpToNextWordBlocked({
    data,
    inputValue,
    targetWord: TestWords.words.getCurrentText(),
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
  if (data === "\n" && !wordsHaveNewline() && Config.mode !== "zen") {
    return true;
  }

  // block input if the word is too long
  const inputLimit =
    Config.mode === "zen" ? 30 : TestWords.words.getCurrentText().length + 20;
  const overLimit = getCurrentInput().length >= inputLimit;
  if (overLimit && (isNextWordBlocked || !dataIsSpace)) {
    console.error("Hitting word limit");
    return true;
  }

  // prevent the word from jumping to the next line if the word is too long
  // this will not work for the first word of each line, but that has a low chance of happening
  const dataIsNotFalsy = data !== null && data !== "";
  const inputIsLongerThanOrEqualToWord =
    getCurrentInput().length >= TestWords.words.getCurrentText().length;

  if (
    !SlowTimer.get() && // don't do this check if slow timer is active
    dataIsNotFalsy &&
    !Config.blindMode &&
    !Config.hideExtraLetters &&
    inputIsLongerThanOrEqualToWord &&
    (isNextWordBlocked || !dataIsSpace) &&
    Config.mode !== "zen"
  ) {
    // make sure to only check this when really necessary
    // because this check is expensive (causes layout reflows)

    // if there is pending word data, we need to account for that
    const pendingWordData = TestUI.pendingWordData.get(
      TestState.activeWordIndex,
    );
    const { top: topAfterAppend, height: heightAfterAppend } =
      TestUI.getActiveWordTopAndHeightWithDifferentData(
        (pendingWordData ?? getCurrentInput()) + data,
      );
    if (topAfterAppend > TestUI.activeWordTop) {
      //word jumped to next line
      return true;
    }
    if (heightAfterAppend > TestUI.activeWordHeight) {
      // letters wrapped to next line
      return true;
    }
  }

  return false;
}
