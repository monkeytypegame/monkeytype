import * as CompositionState from "../../states/composition";
import * as TestState from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import { onInsertText } from "./input";
import { setLastInsertCompositionTextData } from "../core/state";
import * as CompositionDisplay from "../../elements/composition-display";

export function handleCompositionStart(event: CompositionEvent): void {
  CompositionState.setComposing(true);
  CompositionState.setData("");
  setLastInsertCompositionTextData("");
  if (!TestState.isActive) {
    TestLogic.startTest(performance.now());
  }
}

export function handleCompositionUpdate(event: CompositionEvent): void {
  CompositionState.setData(event.data);
  CompositionDisplay.update(event.data);
}

export async function handleCompositionEnd(
  event: CompositionEvent
): Promise<void> {
  if (TestState.testRestarting) return;
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
}
