import * as TestLogic from "../../test/test-logic";
import { setLastInsertCompositionTextData } from "../state";
import { onInsertText } from "../handlers/insert-text";
import { logTestEvent } from "../../test/events/data";
import {
  isTestRestarting,
  getActiveWordIndex,
  isResultCalculating,
  isTestActive,
  setComposing,
  setCompositionData,
} from "../../states/test";

export function onCompositionStart(event: CompositionEvent): void {
  console.debug("wordsInput event compositionstart", {
    event,
    data: event.data,
  });

  const now = performance.now();

  if (isTestRestarting() || isResultCalculating()) return;
  setComposing(true);
  setCompositionData("");
  setLastInsertCompositionTextData("");
  if (!isTestActive()) {
    TestLogic.startTest(now);
  }

  logTestEvent("composition", now, {
    event: "start",
    wordIndex: getActiveWordIndex(),
  });
}

export function onCompositionUpdate(event: CompositionEvent): void {
  console.debug("wordsInput event compositionupdate", {
    event,
    data: event.data,
  });

  if (isTestRestarting() || isResultCalculating()) return;
  setCompositionData(event.data);

  const now = performance.now();

  logTestEvent("composition", now, {
    event: "update",
    data: event.data,
    wordIndex: getActiveWordIndex(),
  });
}

export async function onCompositionEnd(event: CompositionEvent): Promise<void> {
  console.debug("wordsInput event compositionend", {
    event,
    data: event.data,
  });

  if (isTestRestarting() || isResultCalculating()) return;
  setComposing(false);
  setCompositionData("");
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
}
