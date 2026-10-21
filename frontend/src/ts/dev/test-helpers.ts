// Typing test helpers for `window.__mt` (browser QA and profiling).
import { setConfig } from "../config/setters";
import { getInputElement } from "../input/input-element";
import * as CustomText from "../test/custom-text";
import { getCurrentInput } from "../test/events/data";
import { restart } from "../test/test-logic";

/** "\n" types a line break, "\b" deletes the previous character. */
function typeChar(char: string): void {
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

type LetterSnapshot = { text: string; icon?: string; classes: string };
type ChildSnapshot =
  | { index: number; classes: string; letters: LetterSnapshot[] }
  | { sibling: string };

/** The rendered #words children: words with their letters, plus newline siblings. */
export function wordsSnapshot(): ChildSnapshot[] {
  const words = document.querySelector("#words");
  if (words === null) return [];
  return [...words.children].map((child): ChildSnapshot => {
    if (!child.classList.contains("word")) return { sibling: child.className };
    return {
      index: Number((child as HTMLElement).dataset["wordindex"]),
      classes: child.className,
      letters: [...child.querySelectorAll(":scope > letter")].map((letter) => ({
        text: letter.textContent ?? "",
        icon: letter.querySelector("i")?.className,
        classes: letter.className,
      })),
    };
  });
}

/**
 * Px offset of the caret from where it should be: the left edge of the next
 * letter to type, or the right edge of the last letter. Within a few px is on.
 */
export function caretOffset(): { dx: number; dy: number } | undefined {
  const caret = document.querySelector("#caret");
  const letters = document.querySelectorAll("#words .word.active letter");
  if (caret === null || letters.length === 0) return undefined;
  const index = getCurrentInput().length;
  const target = (letters[index] ?? letters[letters.length - 1]) as Element;
  const targetRect = target.getBoundingClientRect();
  const caretRect = caret.getBoundingClientRect();
  const targetX =
    letters[index] === undefined ? targetRect.right : targetRect.left;
  return {
    dx: Math.round(caretRect.left - targetX),
    dy: Math.round(caretRect.top - targetRect.top),
  };
}

/** Starts a custom test with `text`, as the custom text modal's simple mode. */
export async function setCustomText(text: string): Promise<void> {
  const words = text
    .replace(/ +/g, " ")
    .replace(/( *(\r\n|\r|\n) *)/g, "\n ")
    .split(" ")
    .filter((word) => word !== "");
  CustomText.setMode("repeat");
  CustomText.setPipeDelimiter(false);
  CustomText.setText(words);
  CustomText.setLimitMode("word");
  CustomText.setLimitValue(words.length);
  setConfig("mode", "custom");
  await restart();
}
