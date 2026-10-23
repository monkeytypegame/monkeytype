// #wordsInput is rendered by WordsInput and registered here on every mount
let el: HTMLTextAreaElement | undefined;

/** Returns the unregister. */
export function registerInputElement(element: HTMLTextAreaElement): () => void {
  el = element;
  return () => {
    // a remount may have registered a new element already
    if (el === element) el = undefined;
  };
}

export function getInputElement(): HTMLTextAreaElement {
  if (el === undefined) {
    throw new Error("Words input element not mounted");
  }
  return el;
}

export function setInputElementValue(value: string): void {
  getInputElement().value = ` ${value}`;
}

export function appendToInputElementValue(value: string): void {
  getInputElement().value += value;
}

export function getInputElementValue(): {
  inputValue: string;
  realInputValue: string;
} {
  return {
    inputValue: getInputElement().value.slice(1),
    realInputValue: getInputElement().value,
  };
}

export function moveInputElementCaretToTheEnd(): void {
  const el = getInputElement();
  el.setSelectionRange(el.value.length, el.value.length);
}

export function replaceInputElementLastValueChar(char: string): void {
  const { inputValue } = getInputElementValue();
  setInputElementValue(inputValue.slice(0, -1) + char);
}

export function isInputElementFocused(): boolean {
  return el !== undefined && document.activeElement === el;
}

export function focusInputElement(preventScroll = false): void {
  getInputElement().focus({
    preventScroll,
  });
}

/**
 * Scrolls the words input to the center of the window, if the words wrapper
 * doesn't fit on it and the input is below the center (unless forced).
 *
 * Page scrolling, not input handling: here only because WordsInput and
 * test-ui's focusWords both call it. Moves into WordsInput along with
 * focusWords.
 */
export function keepWordsInputInTheCenter(force = false): void {
  if (el === undefined) return;
  // the input renders inside #wordsWrapper
  const wordsWrapperHeight = el.parentElement?.offsetHeight ?? 0;
  const windowHeight = window.innerHeight;

  // dont do anything if the wrapper can fit on screen
  if (wordsWrapperHeight < windowHeight) return;

  const wordsInputBelowCenter =
    el.getBoundingClientRect().top > windowHeight / 2;

  // dont do anything if its above or at the center unless forced
  if (!wordsInputBelowCenter && !force) return;

  el.scrollIntoView({ block: "center" });
}

// no-op once unmounted: TestPage's cleanup blurs after WordsInput unregistered
// its input
export function blurInputElement(): void {
  el?.blur();
}
