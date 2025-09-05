import * as TestInput from "../test/test-input";

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
