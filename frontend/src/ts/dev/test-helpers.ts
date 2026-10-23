// Typing test helpers for `window.__mt` (browser QA and profiling).
import { commands } from "../commandline/lists";
import { Command } from "../commandline/types";
import { setConfig } from "../config/setters";
import { Config } from "../config/store";
import { getInputElement } from "../input/input-element";
import * as CustomText from "../test/custom-text";
import { getCurrentInput } from "../test/events/data";
import { hideModal, showModal } from "../states/modals";
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

/**
 * Layout problems on the test page, empty when it's laid out right: the active
 * word inside the words wrapper, the caret and the words input on it, three
 * full lines (unless all lines are shown), the tape anchor at the tape margin.
 */
export function checkLayout(): string[] {
  const wrapper = document.querySelector("#wordsWrapper");
  const words = document.querySelector<HTMLElement>("#words");
  const active = words?.querySelector<HTMLElement>(".word.active") ?? null;
  if (wrapper === null || words === null || active === null) {
    return ["no active word"];
  }
  const issues: string[] = [];
  const wr = wrapper.getBoundingClientRect();
  const ar = active.getBoundingClientRect();
  const px = Math.round;

  if (ar.top < wr.top - 1 || ar.bottom > wr.bottom + 1) {
    issues.push(
      `active word ${px(ar.top)}-${px(ar.bottom)} outside wrapper ${px(wr.top)}-${px(wr.bottom)}`,
    );
  }
  const caret = caretOffset();
  // a few px off is on, more at big font sizes
  const caretTolerance = Math.max(4, ar.height * 0.1);
  if (
    caret !== undefined &&
    (Math.abs(caret.dx) > caretTolerance || Math.abs(caret.dy) > caretTolerance)
  ) {
    issues.push(`caret off by ${caret.dx},${caret.dy}`);
  }
  const input = getInputElement().getBoundingClientRect();
  if (
    Math.abs(input.top + input.height / 2 - (ar.top + ar.height / 2)) >
    ar.height
  ) {
    issues.push(`words input off the active word by ${px(input.top - ar.top)}`);
  }

  if (Config.tapeMode !== "off") {
    const margin = wr.left + (wr.width * Config.tapeMargin) / 100;
    const letters = active.querySelectorAll("letter");
    const anchor =
      Config.tapeMode === "letter"
        ? letters[getCurrentInput().length]?.getBoundingClientRect().left
        : ar.left;
    if (anchor !== undefined && Math.abs(anchor - margin) > 3) {
      issues.push(`tape anchor ${px(anchor - margin)} from the tape margin`);
    }
  } else if (
    Config.mode !== "zen" &&
    (!Config.showAllLines || Config.mode === "time")
  ) {
    const wordEls = [...words.querySelectorAll<HTMLElement>(".word")];
    const tops = [
      ...new Set(wordEls.map((el) => px(el.getBoundingClientRect().top))),
    ].sort((a, b) => a - b);
    const lineHeight = (tops[1] ?? 0) - (tops[0] ?? 0);
    if (tops.length > 1 && Math.abs(wr.height - 3 * lineHeight) > 3) {
      issues.push(`wrapper ${px(wr.height)}px, not 3 lines of ${lineHeight}px`);
    }
    const clipped = wordEls.find((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.top >= wr.top - 1 && r.top < wr.bottom - 2 && r.bottom > wr.bottom + 1
      );
    });
    if (clipped !== undefined) {
      issues.push(`word ${clipped.dataset["wordindex"]} cut off at the bottom`);
    }
  }

  const marginTop = words.style.marginTop;
  if (marginTop !== "" && marginTop !== "0px") {
    issues.push(`#words margin-top ${marginTop} (line jump unfinished)`);
  }
  return issues;
}

function findCommand(id: string, list: Command[]): Command | undefined {
  for (const command of list) {
    if (command.id === id) return command;
    const found =
      command.subgroup !== undefined
        ? findCommand(id, command.subgroup.list)
        : undefined;
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * Runs a commandline command like the commandline does: opens it (the test
 * unfocuses, the out of focus warning blurs the words after 1s), executes the
 * command, closes it. Input commands take `input` as typed (no validation).
 * Ids: `change<ConfigKey>` subgroups, `set<ConfigKey><Value>`,
 * `set<ConfigKey>Custom` inputs (eg. setFontSizeCustom).
 */
export async function runCommand(id: string, input?: string): Promise<void> {
  const command = findCommand(id, commands.list);
  if (command?.exec === undefined) {
    throw new Error(`No executable commandline command "${id}"`);
  }
  showModal("Commandline");
  // the out of focus warning shows 1s after unfocusing
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const exec = command.exec as (options: { input?: unknown }) => void;
  exec({
    input:
      input !== undefined && "inputValueConvert" in command
        ? (command.inputValueConvert as (value: string) => unknown)(input)
        : input,
  });
  hideModal("Commandline");
}
