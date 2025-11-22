const wordsInput = document.querySelector("#wordsInput") as HTMLInputElement;

if (wordsInput === null) {
  throw new Error("Words input element not found");
}

export function getWordsInput(): HTMLInputElement {
  return wordsInput;
}

export function setInputValue(value: string): void {
  wordsInput.value = " " + value;
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

export function moveCaretToTheEnd(): void {
  wordsInput.setSelectionRange(
    wordsInput.value.length,
    wordsInput.value.length
  );
}

export function replaceLastInputValueChar(char: string): void {
  const { inputValue } = getInputValue();
  setInputValue(inputValue.slice(0, -1) + char);
}
