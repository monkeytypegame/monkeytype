import * as CompositionState from "../../states/composition";
import * as TestState from "../../test/test-state";
import * as TestUI from "../../test/test-ui";
import * as TestLogic from "../../test/test-logic";
import { onInsertText } from "./input";

export function handleCompositionStart(event: CompositionEvent): void {
  CompositionState.setComposing(true);
  if (!TestState.isActive) {
    TestUI.setActiveWordTop();
    TestLogic.startTest(performance.now());
  }
}

export function handleCompositionUpdate(event: CompositionEvent): void {
  CompositionState.setData(event.data);
}

export async function handleCompositionEnd(
  event: CompositionEvent
): Promise<void> {
  CompositionState.setComposing(false);
  CompositionState.setData("");

  const now = performance.now();

  if (event.data !== "") {
    await onInsertText({
      data: event.data,
      now,
    });
  }
}
