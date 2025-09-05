import Config from "../../config";
import * as TestInput from "../../test/test-input";
import * as TestState from "../../test/test-state";
import * as TestWords from "../../test/test-words";
import { getInputValue } from "../input-element";
import { InputEventHandler } from "../types";

export function onBeforeDelete({ event }: InputEventHandler): void {
  if (!TestState.isActive) {
    event.preventDefault();
    return;
  }
  const { inputValue } = getInputValue();
  const inputIsEmpty = inputValue === "";
  const firstWord = TestState.activeWordIndex === 0;

  if (inputIsEmpty && firstWord) {
    //block this no matter what
    event.preventDefault();
    return;
  }

  const freedomMode = Config.freedomMode;
  if (freedomMode) {
    //allow anything in freedom mode
    return;
  }

  const confidence = Config.confidenceMode;
  const previousWordCorrect =
    (TestInput.input.get(TestState.activeWordIndex - 1) ?? "") ===
    TestWords.words.get(TestState.activeWordIndex - 1);

  if (confidence === "on" && inputIsEmpty && !previousWordCorrect) {
    event.preventDefault();
  }

  if (confidence === "max") {
    event.preventDefault();
  }

  if (inputIsEmpty && previousWordCorrect) {
    event.preventDefault();
  }
}
