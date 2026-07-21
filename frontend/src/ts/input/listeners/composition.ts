import { getInputElement } from "../input-element";
import * as CompositionState from "../../legacy-states/composition";
import { testRestarting } from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import { setLastInsertCompositionTextData } from "../state";
import { onInsertText } from "../handlers/insert-text";
import { logTestEvent } from "../../test/events/data";
import {
  getActiveWordIndex,
  isResultCalculating,
  isTestActive,
  setCompositionText,
} from "../../states/test";

const inputEl = getInputElement();

inputEl.addEventListener("compositionstart", (event) => {
  console.debug("wordsInput event compositionstart", {
    event,
    data: event.data,
  });

  const now = performance.now();

  if (testRestarting() || isResultCalculating()) return;
  CompositionState.setComposing(true);
  CompositionState.setData("");
  setLastInsertCompositionTextData("");
  if (!isTestActive()) {
    TestLogic.startTest(now);
  }

  logTestEvent("composition", now, {
    event: "start",
    wordIndex: getActiveWordIndex(),
  });
});

inputEl.addEventListener("compositionupdate", (event) => {
  console.debug("wordsInput event compositionupdate", {
    event,
    data: event.data,
  });

  if (testRestarting() || isResultCalculating()) return;
  CompositionState.setData(event.data);
  setCompositionText(event.data);

  const now = performance.now();

  logTestEvent("composition", now, {
    event: "update",
    data: event.data,
    wordIndex: getActiveWordIndex(),
  });
});

inputEl.addEventListener("compositionend", async (event) => {
  console.debug("wordsInput event compositionend", { event, data: event.data });

  if (testRestarting() || isResultCalculating()) return;
  CompositionState.setComposing(false);
  CompositionState.setData("");
  setCompositionText("");
  setLastInsertCompositionTextData("");

  const now = performance.now();

  if (event.data !== "") {
    await onInsertText({
      data: event.data,
      now,
      isCompositionEnding: true,
    });
  }

  logTestEvent("composition", now, {
    event: "end",
    data: event.data,
    wordIndex: getActiveWordIndex(),
  });
});
