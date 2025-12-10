import Config from "../../config";
import * as TestInput from "../../test/test-input";
import * as TestState from "../../test/test-state";
import * as TestWords from "../../test/test-words";
import { getInputElementValue } from "../input-element";
import * as TestUI from "../../test/test-ui";
import { isAwaitingNextWord } from "../state";

export function onBeforeDelete(event: InputEvent): void {
  if (!TestState.isActive) {
    event.preventDefault();
    return;
  }
  if (TestState.testRestarting) {
    return;
  }
  if (isAwaitingNextWord()) {
    return;
  }
  if (TestUI.resultCalculating) {
    return;
  }

  const { inputValue } = getInputElementValue();
  const inputIsEmpty = inputValue === "";

  if (inputIsEmpty) {
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
    (TestInput.input.get(TestState.activeWordIndex - 1) ?? "") ===
    TestWords.words.get(TestState.activeWordIndex - 1);

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
