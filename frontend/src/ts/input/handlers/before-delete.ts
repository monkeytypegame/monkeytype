import { Config } from "../../config/store";
import * as TestState from "../../test/test-state";
import * as TestWords from "../../test/test-words";
import { getInputElementValue } from "../input-element";
import * as TestUI from "../../test/test-ui";
import { isAwaitingNextWord } from "../state";
import { getInputForWord } from "../../test/events/data";

export function onBeforeDelete(event: InputEvent): void {
  if (!TestState.isActive) {
    event.preventDefault();
    return;
  }
  if (TestState.testRestarting) {
    event.preventDefault();
    return;
  }
  if (isAwaitingNextWord()) {
    event.preventDefault();
    return;
  }
  if (TestState.resultCalculating) {
    event.preventDefault();
    return;
  }

  const { inputValue } = getInputElementValue();
  const inputIsEmpty = inputValue === "";

  if (inputIsEmpty) {
    // we are on the first word, just prevent default, nothing to go back to
    if (TestState.activeWordIndex === 0) {
      event.preventDefault();
      return;
    }

    // this is nested because we only wanna pull the element from the dom if needed
    const previousWordElement = TestUI.getWordElement(
      TestState.activeWordIndex - 1,
    );
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
  const previousWordCorrect =
    getInputForWord(TestState.activeWordIndex - 1) ===
    (TestWords.words.getText(TestState.activeWordIndex - 1) ?? "");

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
