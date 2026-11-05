import {
  getInputElement,
  moveInputElementCaretToTheEnd,
} from "../input-element";

export function onFocus(): void {
  moveInputElementCaretToTheEnd();
}

/** copy, paste, select, selectstart */
export function preventDefault(event: Event): void {
  event.preventDefault();
}

export function onSelectionChange(event: Event): void {
  const inputEl = getInputElement();
  const selection = window.getSelection();

  console.debug("wordsInput event selectionchange", {
    event,
    selection: selection?.toString(),
    isCollapsed: selection?.isCollapsed,
    selectionStart: inputEl.selectionStart,
    selectionEnd: inputEl.selectionEnd,
  });

  const hasSelectedText = inputEl.selectionStart !== inputEl.selectionEnd;
  const isCursorAtEnd = inputEl.selectionStart === inputEl.value.length;
  if (hasSelectedText || !isCursorAtEnd) {
    moveInputElementCaretToTheEnd();
  }
}
