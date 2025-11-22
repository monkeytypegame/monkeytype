import { onBeforeDelete } from "../../handlers/before-delete";
import { onBeforeInsertText } from "../../handlers/before-insert-text";
import { isSupportedInputType } from "../../helpers/input-type";
import { getInputElement } from "../input-element";

const inputEl = getInputElement();

inputEl.addEventListener("beforeinput", async (event) => {
  if (!(event instanceof InputEvent)) {
    //beforeinput is typed as inputevent but input is not?
    //@ts-expect-error just doing this as a sanity check
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
  } else if (inputType === "insertCompositionText") {
    // firefox fires this extra event which we dont want to handle
    if (!event.isComposing) {
      event.preventDefault();
    }
  } else {
    throw new Error("Unhandled beforeinput type: " + inputType);
  }
});
