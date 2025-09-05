import * as TestInput from "../test/test-input";
import { handleBeforeInput } from "./events/beforeinput";
import {
  handleCompositionEnd,
  handleCompositionStart,
  handleCompositionUpdate,
} from "./events/composition";
import { handleInput } from "./events/input";
import { handleKeydown } from "./events/keydown";
import { handleKeyup } from "./events/keyup";

const wordsInput = document.querySelector("#wordsInput") as HTMLInputElement;

export function getWordsInput(): HTMLInputElement {
  return wordsInput;
}

export function setInputValue(value: string): void {
  console.trace();
  console.log("setting input value", value);
  wordsInput.value = " " + value;
  setTestInputToDOMValue();
}

export function setTestInputToDOMValue(appendNewLine = false): void {
  TestInput.input.current =
    getInputValue().inputValue + (appendNewLine ? "\n" : "");
}

export function getInputValue(): {
  inputValue: string;
  realInputValue: string;
} {
  return {
    inputValue: wordsInput.value.slice(1),
    realInputValue: wordsInput.value,
  };
}

function moveCaretToTheEnd(): void {
  wordsInput.setSelectionRange(
    wordsInput.value.length,
    wordsInput.value.length
  );
}

export function replaceLastInputValueChar(char: string): void {
  const { inputValue } = getInputValue();
  setInputValue(inputValue.slice(0, -1) + char);
}

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

wordsInput.addEventListener("selectionchange", () => {
  const hasSelectedText = wordsInput.selectionStart !== wordsInput.selectionEnd;
  const isCursorAtEnd = wordsInput.selectionStart === wordsInput.value.length;

  if (hasSelectedText || !isCursorAtEnd) {
    // force caret at end of input
    moveCaretToTheEnd();
  }
});

wordsInput.addEventListener("keyup", async (event) => {
  console.debug("wordsInput event keyup", {
    key: event.key,
    code: event.code,
  });
  await handleKeyup(event);
});

wordsInput.addEventListener("keydown", async (event) => {
  console.debug("wordsInput event keydown", {
    key: event.key,
    code: event.code,
  });
  await handleKeydown(event);
});

wordsInput.addEventListener("beforeinput", async (event) => {
  console.debug("wordsInput event beforeinput", {
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
    inputType: event.inputType,
    data: event.data,
    value: (event.target as HTMLInputElement).value,
  });
  await handleInput(event);
});

wordsInput.addEventListener("compositionstart", (event) => {
  console.debug("wordsInput event compositionstart", { data: event.data });
  handleCompositionStart(event);
});

wordsInput.addEventListener("compositionupdate", (event) => {
  console.debug("wordsInput event compositionupdate", { data: event.data });
  handleCompositionUpdate(event);
});

wordsInput.addEventListener("compositionend", async (event) => {
  console.debug("wordsInput event compositionend", { data: event.data });
  await handleCompositionEnd(event);
});
