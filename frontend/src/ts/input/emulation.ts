import { getInputValue, getWordsInput } from "./input-element";
import { onBeforeInsertText } from "./events/beforeinput";
import { onInsertText } from "./events/input";

export async function emulateInsertText(
  data: string,
  event: KeyboardEvent,
  now: number
): Promise<void> {
  const preventDefault = onBeforeInsertText({
    data,
    now,
    event,
    inputType: "insertText",
  });

  if (preventDefault) {
    return;
  }

  // default is prevented so we need to manually update the input value.
  // remember to not call setInputValue or setTestInputToDOMValue in here
  // because onBeforeInsertText can also block the event
  // setInputValue and setTestInputToDOMValue will be called later be updated in onInsertText
  const { inputValue } = getInputValue();
  getWordsInput().value = " " + inputValue + data;

  await onInsertText({
    data,
    now,
    event,
    inputType: "insertText",
  });
}
