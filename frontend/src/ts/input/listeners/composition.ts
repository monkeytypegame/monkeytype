import * as TestLogic from "../../test/test-logic";
import { setLastInsertCompositionTextData } from "../state";
import { onInsertText } from "../handlers/insert-text";
import { logTestEvent } from "../../test/engine/events/data";
import {
  setComposing,
  setCompositionData,
  isRestartAnimating,
} from "../../states/test";
import {
  getActiveWordIndex,
  isTestRestarting,
  isTestActive,
  isTestFinished,
} from "../../test/engine/state";

export function onCompositionStart(event: CompositionEvent): void {
  console.debug("wordsInput event compositionstart", {
    event,
    data: event.data,
  });

  const now = performance.now();

  if (isTestRestarting() || isTestFinished() || isRestartAnimating()) {
    return;
  }
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

  if (isTestRestarting() || isTestFinished() || isRestartAnimating()) {
    return;
  }
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

  if (isTestRestarting() || isTestFinished() || isRestartAnimating()) {
    return;
  }
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
