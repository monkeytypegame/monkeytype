import { getInputElement } from "../input-element";
import * as CompositionState from "../../states/composition";
import * as TestState from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import { setLastInsertCompositionTextData } from "../state";
import * as CompositionDisplay from "../../elements/composition-display";
import { onInsertText } from "../handlers/insert-text";
import * as TestUI from "../../test/test-ui";

const inputEl = getInputElement();

inputEl.addEventListener("compositionstart", (event) => {
  console.debug("wordsInput event compositionstart", {
    event,
    data: event.data,
  });

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

  CompositionState.setData(event.data);
  CompositionDisplay.update(event.data);
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
