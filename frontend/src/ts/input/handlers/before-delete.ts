import { Config } from "../../config/store";
import * as TestWords from "../../test/test-words";
import { getInputElementValue } from "../input-element";
import { isWordRendered } from "../../states/words-render";
import { isAwaitingNextWord } from "../state";
import { getInputForWord } from "../../test/events/data";
import {
  isTestRestarting,
  getActiveWordIndex,
  isResultCalculating,
  isTestActive,
} from "../../states/test";

export function onBeforeDelete(event: InputEvent): void {
  if (!isTestActive()) {
    event.preventDefault();
    return;
  }
  if (isTestRestarting()) {
    event.preventDefault();
    return;
  }
  if (isAwaitingNextWord()) {
    event.preventDefault();
    return;
  }
  if (isResultCalculating()) {
    event.preventDefault();
    return;
  }

  const { inputValue } = getInputElementValue();
  const inputIsEmpty = inputValue === "";

  if (inputIsEmpty) {
    // we are on the first word, just prevent default, nothing to go back to
    if (getActiveWordIndex() === 0) {
      event.preventDefault();
      return;
    }

    // previous word scrolled off (line jump / tape), can't go back to it
    if (!isWordRendered(getActiveWordIndex() - 1)) {
      event.preventDefault();
      return;
    }
  }

  if (Config.freedomMode) {
    //allow anything in freedom mode
    return;
  }

  const confidence = Config.confidenceMode;
  const previousWord = TestWords.words.get(getActiveWordIndex() - 1);
  const previousWordCorrect =
    getInputForWord(getActiveWordIndex() - 1) === previousWord?.textWithCommit;

  if (confidence === "on" && inputIsEmpty && !previousWordCorrect) {
    event.preventDefault();
    return;
  }

  if (confidence === "max") {
    event.preventDefault();
    return;
  }

  if (inputIsEmpty && previousWordCorrect) {
    event.preventDefault();
    return;
  }
}
