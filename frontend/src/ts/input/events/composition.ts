import * as CompositionState from "../../states/composition";
import * as TestState from "../../test/test-state";
import * as TestUI from "../../test/test-ui";
import * as TestLogic from "../../test/test-logic";
import { onInsertText } from "./input";
import {
  setLastCompositionUpdateSameAsInput,
  setLastInsertCompositionTextData,
} from "../core/state";
import { getInputValue } from "../core/input-element";

export function handleCompositionStart(event: CompositionEvent): void {
  CompositionState.setComposing(true);
  CompositionState.setData("");
  setLastInsertCompositionTextData("");
  if (!TestState.isActive) {
    TestUI.setActiveWordTop();
    TestLogic.startTest(performance.now());
  }
}

export function handleCompositionUpdate(event: CompositionEvent): void {
  CompositionState.setData(event.data);
  const { inputValue } = getInputValue();
  if (inputValue.slice(-event.data.length) === event.data) {
    setLastCompositionUpdateSameAsInput(true);
  } else {
    setLastCompositionUpdateSameAsInput(false);
  }
}

export async function handleCompositionEnd(
  event: CompositionEvent
): Promise<void> {
  CompositionState.setComposing(false);
  CompositionState.setData("");
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
