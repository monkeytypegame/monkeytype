import { getInputElement } from "../input-element";
import * as CompositionState from "../../legacy-states/composition";
import * as TestState from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import * as TestInput from "../../test/test-input";
import { setLastInsertCompositionTextData } from "../state";
import * as CompositionDisplay from "../../elements/composition-display";
import { onInsertText } from "../handlers/insert-text";
import * as TestUI from "../../test/test-ui";
import { logTestEvent } from "../../test/events/data";

const inputEl = getInputElement();

inputEl.addEventListener("compositionstart", (event) => {
  console.debug("wordsInput event compositionstart", {
    event,
    data: event.data,
  });

  const now = performance.now();

  if (TestState.testRestarting || TestUI.resultCalculating) return;
  CompositionState.setComposing(true);
  CompositionState.setData("");
  setLastInsertCompositionTextData("");
  if (!TestState.isActive) {
    TestLogic.startTest(now);
  }
  if (TestInput.input.current.length === 0) {
    TestInput.setBurstStart(now);
  }

  logTestEvent("compositionStart", now, {
    data: event.data,
  });
});

inputEl.addEventListener("compositionupdate", (event) => {
  console.debug("wordsInput event compositionupdate", {
    event,
    data: event.data,
  });

  if (TestState.testRestarting || TestUI.resultCalculating) return;
  CompositionState.setData(event.data);
  CompositionDisplay.update(event.data);

  const now = performance.now();

  logTestEvent("compositionUpdate", now, {
    data: event.data,
  });
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

  logTestEvent("compositionEnd", now, {
    data: event.data,
  });
});
