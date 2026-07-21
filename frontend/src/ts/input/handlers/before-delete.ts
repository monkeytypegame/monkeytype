import { Config } from "../../config/store";
import { testRestarting } from "../../test/test-state";
import * as TestWords from "../../test/test-words";
import { getInputElementValue } from "../input-element";
import * as TestUI from "../../test/test-ui";
import { isAwaitingNextWord } from "../state";
import { getInputForWord } from "../../test/events/data";
import {
  getActiveWordIndex,
  isResultCalculating,
  isTestActive,
} from "../../states/test";

export function onBeforeDelete(event: InputEvent): void {
  if (!isTestActive()) {
    event.preventDefault();
    return;
  }
  if (testRestarting()) {
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

    // this is nested because we only wanna pull the element from the dom if needed
    const previousWordElement = TestUI.getWordElement(getActiveWordIndex() - 1);
    if (previousWordElement === null) {
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
