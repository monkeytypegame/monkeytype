// Types through the real words input handlers, firing the events a browser
// fires. Shared by `window.__mt` (browser QA) and the test-page harness.
import { getInputElement } from "../input/input-element";

/** "\n" types a line break, "\b" deletes the previous character. */
export function typeChar(char: string): void {
  const input = getInputElement();
  if (document.activeElement !== input) input.focus();
  const key = char === "\n" ? "Enter" : char === "\b" ? "Backspace" : char;
  input.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );

  const inputType =
    char === "\n"
      ? "insertLineBreak"
      : char === "\b"
        ? "deleteContentBackward"
        : "insertText";
  const data = inputType === "insertText" ? char : null;
  const beforeInput = new InputEvent("beforeinput", {
    inputType,
    data,
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(beforeInput);
  if (!beforeInput.defaultPrevented) {
    if (inputType === "deleteContentBackward") {
      input.value = input.value.slice(0, -1);
    } else {
      input.setRangeText(char, input.selectionStart, input.selectionEnd, "end");
    }
    input.dispatchEvent(
      new InputEvent("input", { inputType, data, bubbles: true }),
    );
  }

  input.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
}

/**
 * Deletes the previous word like Ctrl/Alt+Backspace: the trailing word and
 * the whitespace after it, or only whitespace when nothing else trails.
 */
export function deleteWord(): void {
  const input = getInputElement();
  if (document.activeElement !== input) input.focus();
  const key = "Backspace";
  const inputType = "deleteWordBackward";
  input.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  const beforeInput = new InputEvent("beforeinput", {
    inputType,
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(beforeInput);
  if (!beforeInput.defaultPrevented) {
    input.value = input.value.replace(/(?:\S+\s*|\s+)$/, "");
    input.dispatchEvent(new InputEvent("input", { inputType, bubbles: true }));
  }
  input.dispatchEvent(
    new KeyboardEvent("keyup", { key, ctrlKey: true, bubbles: true }),
  );
}

/**
 * Types `text` through the real input handlers, one character every
 * `msPerChar` (0: all in one task). "\n" is a line break, "\b" a backspace.
 */
export async function typeText(text: string, msPerChar = 0): Promise<void> {
  for (const char of text) {
    typeChar(char);
    if (msPerChar > 0) {
      await new Promise((resolve) => setTimeout(resolve, msPerChar));
    }
  }
}

/**
 * Composes text like an IME: each of `updates` is the composition so far
 * (eg. ["k", "か"]), the last one is committed.
 */
export function compose(updates: string[]): void {
  const input = getInputElement();
  if (document.activeElement !== input) input.focus();
  const start = input.selectionStart;
  input.dispatchEvent(
    new CompositionEvent("compositionstart", { data: "", bubbles: true }),
  );
  for (const data of updates) {
    input.dispatchEvent(
      new CompositionEvent("compositionupdate", { data, bubbles: true }),
    );
    const init = {
      inputType: "insertCompositionText",
      data,
      isComposing: true,
      bubbles: true,
    };
    input.dispatchEvent(
      new InputEvent("beforeinput", { ...init, cancelable: true }),
    );
    // the composition replaces itself in the input
    input.setRangeText(data, start, input.selectionEnd, "end");
    input.dispatchEvent(new InputEvent("input", init));
  }
  input.dispatchEvent(
    new CompositionEvent("compositionend", {
      data: updates[updates.length - 1] ?? "",
      bubbles: true,
    }),
  );
}
