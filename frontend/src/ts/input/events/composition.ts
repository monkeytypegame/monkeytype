import * as CompositionState from "../../states/composition";
import * as TestState from "../../test/test-state";
import * as TestUI from "../../test/test-ui";
import * as TestLogic from "../../test/test-logic";
import { onInsertText } from "./input";

export function handleCompositionStart(event: CompositionEvent): void {
  console.debug("wordsInput event compositionstart", { data: event.data });
  CompositionState.setComposing(true);
  if (!TestState.isActive) {
    TestUI.setActiveWordTop();
    TestLogic.startTest(performance.now());
  }
}

export function handleCompositionUpdate(event: CompositionEvent): void {
  console.debug("wordsInput event compositionupdate", { data: event.data });
  CompositionState.setData(event.data);
}

export async function handleCompositionEnd(
  event: CompositionEvent
): Promise<void> {
  console.debug("wordsInput event compositionend", { data: event.data });
  CompositionState.setComposing(false);
  CompositionState.setData("");

  const now = performance.now();

  await onInsertText({
    event,
    inputType: "insertText",
    data: event.data,
    now,
  });
}
