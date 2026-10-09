import {
  getInputElement,
  moveInputElementCaretToTheEnd,
} from "../input-element";

export function init(signal: AbortSignal): void {
  const inputEl = getInputElement();

  inputEl.addEventListener(
    "focus",
    () => {
      moveInputElementCaretToTheEnd();
    },
    { signal },
  );

  // native addEventListener takes one event type per call
  for (const type of ["copy", "paste", "select", "selectstart"]) {
    inputEl.addEventListener(
      type,
      (event) => {
        event.preventDefault();
      },
      { signal },
    );
  }

  inputEl.addEventListener(
    "selectionchange",
    (event) => {
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
    },
    { signal },
  );
}
