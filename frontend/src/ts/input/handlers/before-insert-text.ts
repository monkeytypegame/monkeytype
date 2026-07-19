import { Config } from "../../config/store";
import * as TestState from "../../test/test-state";
import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import { isFunboxActiveWithProperty } from "../../test/funbox/list";
import { getInputElementValue } from "../input-element";
import { isAwaitingNextWord } from "../state";
import * as SlowTimer from "../../legacy-states/slow-timer";
import {
  getActiveWordIndex,
  isResultCalculating,
  wordsHaveNewline,
} from "../../states/test";
import { shouldGoToNextWord } from "../helpers/validation";
import { getCommitCharacterType, normalizeData } from "../helpers/util";
import { getCurrentInput } from "../../test/events/data";
import { isSpace } from "../../utils/strings";

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

  if (isResultCalculating()) {
    return true;
  }

  //only allow newlines if the test has newlines or in zen mode
  if (data === "\n" && !wordsHaveNewline() && Config.mode !== "zen") {
    return true;
  }

  //prevent space in nospace funbox
  if (isSpace(data) && isFunboxActiveWithProperty("nospace")) {
    return true;
  }

  const { inputValue } = getInputElementValue();
  const currentWordObj = TestWords.words.getCurrent();
  const currentWordTextWithCommit = currentWordObj?.textWithCommit ?? "";
  const currentWordTextDisplay = currentWordObj?.display ?? "";

  //normalize visually-equivalent chars (e.g. IME U+3000 space) to the target
  //char, matching onInsertText, so commit classification is consistent
  data = normalizeData(data, inputValue, currentWordTextWithCommit);

  const commitCharacterType = getCommitCharacterType({
    data,
    inputValue,
    targetWord: currentWordTextWithCommit,
  });

  //prevent separator from being inserted if input is empty
  //allow if strict space is enabled
  if (
    isSpace(data) &&
    inputValue === "" &&
    Config.difficulty === "normal" &&
    !Config.strictSpace
  ) {
    return true;
  }

  // block input if the word is too long
  const inputLimit =
    Config.mode === "zen" ? 30 : currentWordTextWithCommit.length + 20;
  const overLimit = inputValue.length >= inputLimit;
  const goingToNextWord = shouldGoToNextWord({
    data,
    inputValue,
    targetWord: currentWordTextWithCommit,
    commitCharacterType,
  });

  if (overLimit && !goingToNextWord) {
    console.error("Hitting word limit");
    return true;
  }

  // prevent the word from jumping to the next line if the word is too long
  // this will not work for the first word of each line, but that has a low chance of happening
  const dataIsNotFalsy = data !== null && data !== "";
  const inputIsLongerThanOrEqualToWord =
    getCurrentInput().length >= currentWordTextDisplay.length;

  if (
    !SlowTimer.get() && // don't do this check if slow timer is active
    dataIsNotFalsy &&
    !Config.blindMode &&
    !Config.hideExtraLetters &&
    inputIsLongerThanOrEqualToWord &&
    !goingToNextWord &&
    Config.mode !== "zen"
  ) {
    // make sure to only check this when really necessary
    // because this check is expensive (causes layout reflows)

    // if there is pending word data, we need to account for that
    const pendingWordData = TestUI.pendingWordData.get(getActiveWordIndex());
    const { top: topAfterAppend, height: heightAfterAppend } =
      TestUI.getActiveWordTopAndHeightWithDifferentData(
        (pendingWordData ?? inputValue) + data,
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
