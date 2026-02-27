import { onDelete } from "../handlers/delete";
import { onInsertText } from "../handlers/insert-text";
import { isSupportedInputType } from "../helpers/input-type";
import { getInputElement } from "../input-element";
import {
  getLastInsertCompositionTextData,
  setLastInsertCompositionTextData,
} from "../state";
import * as TestUI from "../../test/test-ui";
import { onBeforeInsertText } from "../handlers/before-insert-text";
import { onBeforeDelete } from "../handlers/before-delete";
import * as TestInput from "../../test/test-input";
import * as TestWords from "../../test/test-words";
import * as CompositionState from "../../states/composition";
import { activeWordIndex } from "../../test/test-state";
import { areAllTestWordsGenerated } from "../../test/test-logic";

const inputEl = getInputElement();

inputEl.addEventListener("beforeinput", async (event) => {
  if (!(event instanceof InputEvent)) {
    //beforeinput is typed as inputevent but input is not?
    //@ts-expect-error just doing this as a sanity check
    // oxlint-disable-next-line no-unsafe-call
    event.preventDefault();
    return;
  }
  console.debug("wordsInput event beforeinput", {
    event,
    inputType: event.inputType,
    data: event.data,
    value: (event.target as HTMLInputElement).value,
  });

  if (!isSupportedInputType(event.inputType)) {
    event.preventDefault();
    return;
  }

  const inputType = event.inputType;

  if (
    (inputType === "insertText" && event.data !== null) ||
    inputType === "insertLineBreak"
  ) {
    let data = event.data as string;
    if (inputType === "insertLineBreak") {
      // insertLineBreak events dont have data set
      data = "\n";
    }

    const preventDefault = onBeforeInsertText(data);
    if (preventDefault) {
      event.preventDefault();
    }
  } else if (
    inputType === "deleteWordBackward" ||
    inputType === "deleteContentBackward"
  ) {
    onBeforeDelete(event);
  } else if (
    inputType === "insertCompositionText" ||
    inputType === "insertFromComposition"
  ) {
    // firefox fires this extra event which we dont want to handle
    if (!event.isComposing) {
      event.preventDefault();
    }
  } else {
    throw new Error("Unhandled beforeinput type: " + inputType);
  }
});

inputEl.addEventListener("input", async (event) => {
  if (!(event instanceof InputEvent)) {
    //since the listener is on an input element, this should never trigger
    //but its here to narrow the type of "event"
    //@ts-expect-error type narrowing
    // oxlint-disable-next-line typescript/no-unsafe-call
    event.preventDefault();
    return;
  }
  console.debug("wordsInput event input", {
    event,
    inputType: event.inputType,
    data: event.data,
    value: (event.target as HTMLInputElement).value,
  });

  // this shouldnt be neccesary because beforeinput already prevents default
  // but some browsers (LIKE SAFARI) seem to ignore that, so just double checking here
  if (!isSupportedInputType(event.inputType)) {
    event.preventDefault();
    return;
  }

  const now = performance.now();

  const inputType = event.inputType;

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
  } else if (
    inputType === "insertCompositionText" ||
    inputType === "insertFromComposition"
  ) {
    const allWordsTyped = activeWordIndex >= TestWords.words.length - 1;
    const inputPlusComposition =
      TestInput.input.current + (CompositionState.getData() ?? "");
    const inputPlusCompositionIsCorrect =
      TestWords.words.getCurrent() === inputPlusComposition;

    // composition quick end
    // if the user typed the entire word correctly but is still in composition
    // dont wait for them to end the composition manually, just end the test
    // by dispatching a compositionend which will trigger onInsertText
    if (
      areAllTestWordsGenerated() &&
      allWordsTyped &&
      inputPlusCompositionIsCorrect
    ) {
      getInputElement().dispatchEvent(
        new CompositionEvent("compositionend", { data: event.data ?? "" }),
      );
    }

    // in case the data is the same as the last one, just ignore it
    if (getLastInsertCompositionTextData() !== event.data) {
      setLastInsertCompositionTextData(event.data ?? "");
      TestUI.afterTestCompositionUpdate();
    }
  } else {
    throw new Error("Unhandled input type: " + inputType);
  }
});
