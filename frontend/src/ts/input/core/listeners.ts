import { handleBeforeInputEvent } from "../handlers/beforeinput";
import {
  handleCompositionEndEvent,
  handleCompositionStartEvent,
  handleCompositionUpdateEvent,
} from "../handlers/composition";
import { handleInputEvent } from "../handlers/input";
import { handleKeydownEvent } from "../handlers/keydown";
import { handleKeyupEvent } from "../handlers/keyup";
import { handleSelectionChangeEvent } from "../handlers/selection";
import {
  getInputElement,
  moveInputElementCaretToTheEnd,
} from "./input-element";

const inputEl = getInputElement();

inputEl.addEventListener("focus", () => {
  moveInputElementCaretToTheEnd();
});

inputEl.addEventListener("copy paste", (event) => {
  event.preventDefault();
});

//this might not do anything
inputEl.addEventListener("select selectstart", (event) => {
  event.preventDefault();
});

inputEl.addEventListener("selectionchange", (event) => {
  const selection = window.getSelection();
  console.debug("wordsInput event selectionchange", {
    event,
    selection: selection?.toString(),
    isCollapsed: selection?.isCollapsed,
    selectionStart: (event.target as HTMLInputElement).selectionStart,
    selectionEnd: (event.target as HTMLInputElement).selectionEnd,
  });
  handleSelectionChangeEvent(event);
});

inputEl.addEventListener("keyup", async (event) => {
  console.debug("wordsInput event keyup", {
    event,
    key: event.key,
    code: event.code,
  });
  await handleKeyupEvent(event);
});

inputEl.addEventListener("keydown", async (event) => {
  console.debug("wordsInput event keydown", {
    event,
    key: event.key,
    code: event.code,
  });
  await handleKeydownEvent(event);
});

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
  await handleBeforeInputEvent(event);
});

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
  await handleInputEvent(event);
});

inputEl.addEventListener("compositionstart", (event) => {
  console.debug("wordsInput event compositionstart", {
    event,
    data: event.data,
  });
  handleCompositionStartEvent(event);
});

inputEl.addEventListener("compositionupdate", (event) => {
  console.debug("wordsInput event compositionupdate", {
    event,
    data: event.data,
  });
  handleCompositionUpdateEvent(event);
});

inputEl.addEventListener("compositionend", async (event) => {
  console.debug("wordsInput event compositionend", { event, data: event.data });
  await handleCompositionEndEvent(event);
});
