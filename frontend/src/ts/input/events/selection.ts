import { moveCaretToTheEnd } from "../core/input-element";

export function handleSelectionChange(event: Event): void {
  const el = event.target;
  if (el === null || !(el instanceof HTMLInputElement)) {
    return;
  }

  const hasSelectedText = el.selectionStart !== el.selectionEnd;
  const isCursorAtEnd = el.selectionStart === el.value.length;
  if (hasSelectedText || !isCursorAtEnd) {
    // force caret at end of input
    moveCaretToTheEnd();
  }
}
