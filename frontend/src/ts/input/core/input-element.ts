const el = document.querySelector("#wordsInput") as HTMLInputElement;

if (el === null) {
  throw new Error("Words input element not found");
}

export function getInputElement(): HTMLInputElement {
  return el;
}

export function setInputElementValue(value: string): void {
  el.value = " " + value;
}

export function getInputElementValue(): {
  inputValue: string;
  realInputValue: string;
} {
  return {
    inputValue: el.value.slice(1),
    realInputValue: el.value,
  };
}

export function moveInputElementCaretToTheEnd(): void {
  el.setSelectionRange(el.value.length, el.value.length);
}

export function replaceInputElementLastValueChar(char: string): void {
  const { inputValue } = getInputElementValue();
  setInputElementValue(inputValue.slice(0, -1) + char);
}

export function isInputElementFocused(): boolean {
  return document.activeElement === el;
}

export function focusInputElement(): void {
  el.focus();
}

export function blurInputElement(): void {
  el.blur();
}
