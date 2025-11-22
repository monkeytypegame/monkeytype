import { handleBeforeInput } from "../handlers/beforeinput";
import {
  handleCompositionEnd,
  handleCompositionStart,
  handleCompositionUpdate,
} from "../handlers/composition";
import { handleInput } from "../handlers/input";
import { handleKeydown } from "../handlers/keydown";
import { handleKeyup } from "../handlers/keyup";
import { handleSelectionChange } from "../handlers/selection";
import { getInputElement, moveCaretToTheEnd } from "./input-element";

const wordsInput = getInputElement();

wordsInput.addEventListener("focus", () => {
  moveCaretToTheEnd();
});

wordsInput.addEventListener("copy paste", (event) => {
  event.preventDefault();
});

//this might not do anything
wordsInput.addEventListener("select selectstart", (event) => {
  event.preventDefault();
});

wordsInput.addEventListener("selectionchange", (event) => {
  const selection = window.getSelection();
  console.debug("wordsInput event selectionchange", {
    event,
    selection: selection?.toString(),
    isCollapsed: selection?.isCollapsed,
    selectionStart: (event.target as HTMLInputElement).selectionStart,
    selectionEnd: (event.target as HTMLInputElement).selectionEnd,
  });
  handleSelectionChange(event);
});

wordsInput.addEventListener("keyup", async (event) => {
  console.debug("wordsInput event keyup", {
    event,
    key: event.key,
    code: event.code,
  });
  await handleKeyup(event);
});

wordsInput.addEventListener("keydown", async (event) => {
  console.debug("wordsInput event keydown", {
    event,
    key: event.key,
    code: event.code,
  });
  await handleKeydown(event);
});

wordsInput.addEventListener("beforeinput", async (event) => {
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
  await handleBeforeInput(event);
});

wordsInput.addEventListener("input", async (event) => {
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
  await handleInput(event);
});

wordsInput.addEventListener("compositionstart", (event) => {
  console.debug("wordsInput event compositionstart", {
    event,
    data: event.data,
  });
  handleCompositionStart(event);
});

wordsInput.addEventListener("compositionupdate", (event) => {
  console.debug("wordsInput event compositionupdate", {
    event,
    data: event.data,
  });
  handleCompositionUpdate(event);
});

wordsInput.addEventListener("compositionend", async (event) => {
  console.debug("wordsInput event compositionend", { event, data: event.data });
  await handleCompositionEnd(event);
});
