import { getInputElement } from "../input-element";
import * as CompositionState from "../../states/composition";
import * as TestState from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import { setLastInsertCompositionTextData } from "../state";
import * as CompositionDisplay from "../../elements/composition-display";
import { onInsertText } from "../handlers/insert-text";
import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import * as TestInput from "../../test/test-input";
import * as Strings from "../../utils/strings";

const inputEl = getInputElement();

inputEl.addEventListener("compositionstart", (event) => {
  console.debug("wordsInput event compositionstart", {
    event,
    data: event.data,
  });

  if (TestState.testRestarting || TestUI.resultCalculating) return;
  CompositionState.setComposing(true);
  CompositionState.setData("");
  setLastInsertCompositionTextData("");
  if (!TestState.isActive) {
    TestLogic.startTest(performance.now());
  }
});

inputEl.addEventListener("compositionupdate", (event) => {
  console.debug("wordsInput event compositionupdate", {
    event,
    data: event.data,
  });

  if (TestState.testRestarting || TestUI.resultCalculating) return;
  const currentWord = TestWords.words.getCurrent();
  const typedSoFar = TestInput.input.current;
  const remainingChars =
    Strings.splitIntoCharacters(currentWord).length -
    Strings.splitIntoCharacters(typedSoFar).length;
  // Prevent rendering more composition glyphs than the word has remaining letters,
  // so IME preedit strings (e.g. romaji) don't push text to the next line.
  const limitedCompositionData =
    remainingChars > 0
      ? Strings.splitIntoCharacters(event.data)
          .slice(0, remainingChars)
          .join("")
      : "";

  CompositionState.setData(limitedCompositionData);
  CompositionDisplay.update(limitedCompositionData);
});

inputEl.addEventListener("compositionend", async (event) => {
  console.debug("wordsInput event compositionend", { event, data: event.data });

  if (TestState.testRestarting || TestUI.resultCalculating) return;
  CompositionState.setComposing(false);
  CompositionState.setData("");
  CompositionDisplay.update("");
  setLastInsertCompositionTextData("");

  const now = performance.now();

  if (event.data !== "") {
    await onInsertText({
      data: event.data,
      now,
      isCompositionEnding: true,
    });
  }
});
