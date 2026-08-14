import { Config } from "../../config/store";
import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import { isFunboxActiveWithProperty } from "../../test/funbox/list";
import { getInputElementValue } from "../input-element";
import { isAwaitingNextWord } from "../state";
import * as SlowTimer from "../../legacy-states/slow-timer";
import {
  isTestRestarting,
  getActiveWordIndex,
  isResultCalculating,
  wordsHaveNewline,
} from "../../states/test";
import { shouldGoToNextWord } from "../helpers/validation";
import { getCommitCharacterType, normalizeData } from "../helpers/util";
import { getCurrentInput } from "../../test/events/data";
import { isSpace } from "../../utils/strings";
import { getRaceCountdown } from "../../states/multiplayer";

/**
 * Handles logic before inserting text into the input element.
 * @param data - The text data to be inserted.
 * @returns Whether to prevent the default insertion behavior.
 */
export function onBeforeInsertText(data: string): boolean {
  // multiplayer race hasn't started yet: words are visible (blurred) but
  // typing shouldn't count, or start the timer, until the synchronized "go"
  if (getRaceCountdown() !== null) {
    return true;
  }

  if (isTestRestarting()) {
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
  //some conditions may override this
  //the hard delete on error variants need the separator to reach onInsertText
  //so it can be counted as a mistake and send the user back a word - it can
  //never be a mistake in zen, so dont let it through there
  const deleteOnErrorIsHard =
    Config.mode !== "zen" &&
    (Config.deleteOnError === "letter_hard" ||
      Config.deleteOnError === "word_hard");
  const allowFirstSeparator =
    Config.strictSpace || Config.difficulty !== "normal" || deleteOnErrorIsHard;
  if (isSpace(data) && inputValue === "" && !allowFirstSeparator) {
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
    !Config.deleteOnError.includes("hard") &&
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
