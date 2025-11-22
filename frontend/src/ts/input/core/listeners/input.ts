import { onDelete } from "../../handlers/delete";
import { onInsertText } from "../../handlers/insert-text";
import { SupportedInputType } from "../../helpers/input-type";
import { getInputElement } from "../input-element";
import {
  getLastInsertCompositionTextData,
  setLastInsertCompositionTextData,
} from "../state";
import * as TestUI from "../../../test/test-ui";

const inputEl = getInputElement();

inputEl.addEventListener("input", async (event) => {
  if (!(event instanceof InputEvent)) {
    //since the listener is on an input element, this should never trigger
    //but its here to narrow the type of "event"
    event.preventDefault();
    return;
  }
  console.debug("wordsInput event input", {
    event,
    inputType: event.inputType,
    data: event.data,
    value: (event.target as HTMLInputElement).value,
  });

  const now = performance.now();

  // this is ok to cast because we are preventing default
  // in the input listener for unsupported input types
  const inputType = event.inputType as SupportedInputType;

  if (
    (inputType === "insertText" && event.data !== null) ||
    inputType === "insertLineBreak"
  ) {
    let data = event.data as string;
    if (inputType === "insertLineBreak") {
      // insertLineBreak events dont have data set
      data = "\n";
    }

    await onInsertText({
      data,
      now,
    });
  } else if (
    inputType === "deleteWordBackward" ||
    inputType === "deleteContentBackward"
  ) {
    onDelete(inputType);
  } else if (inputType === "insertCompositionText") {
    // in case the data is the same as the last one, just ignore it
    if (getLastInsertCompositionTextData() !== event.data) {
      setLastInsertCompositionTextData(event.data ?? "");
      TestUI.afterTestCompositionUpdate();
    }
  } else {
    throw new Error("Unhandled input type: " + inputType);
  }
});
