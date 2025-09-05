import { moveCaretToTheEnd } from "../core/input-element";

export function handleSelectionChange(event: Event): void {
  if (event.target === null || !(event.target instanceof HTMLInputElement)) {
    return;
  }

  const hasSelectedText =
    event.target.selectionStart !== event.target.selectionEnd;
  const isCursorAtEnd =
    event.target.selectionStart === event.target.value.length;

  if (hasSelectedText || !isCursorAtEnd) {
    // force caret at end of input
    moveCaretToTheEnd();
  }
}
