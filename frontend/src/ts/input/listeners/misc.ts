import {
  getInputElement,
  moveInputElementCaretToTheEnd,
} from "../input-element";

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
  const el = event.target;
  if (el === null || !(el instanceof HTMLInputElement)) {
    return;
  }

  const hasSelectedText = el.selectionStart !== el.selectionEnd;
  const isCursorAtEnd = el.selectionStart === el.value.length;
  if (hasSelectedText || !isCursorAtEnd) {
    moveInputElementCaretToTheEnd();
  }
});
