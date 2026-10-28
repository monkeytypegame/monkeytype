// Dev-only `window.__mt` handle for poking app internals from the browser console
// or browser automation. Loaded via dynamic import behind `import.meta.env.DEV`.
import type { Command } from "../commandline/types";
import { Config, getConfig } from "../config/store";
import { setConfig } from "../config/setters";
import { getInputElement } from "../input/input-element";
import { setPreloading } from "../router/create-router";
import { getRouter } from "../router/instance";
import { navigate } from "../router/navigate";
import { getRoutePage } from "../states/router";
import { hideModal, showModal } from "../states/modals";
import * as CustomText from "../test/custom-text";
import { getCurrentInput } from "../test/events/data";
import { restartTest } from "../test/test-logic";
import { quickLogin } from "./quick-login";
import { trackedSignals } from "./signal-tracker";
import { compose, typeText } from "./typing-driver";

// Modules hot-updated since the page loaded. Kept on window: it survives this
// module's own hot update, and the listener registers once per page.
if (window.__mtHotUpdates === undefined) {
  window.__mtHotUpdates = [];
  import.meta.hot?.on("vite:afterUpdate", (payload) => {
    // css updates leave no stale state
    for (const update of payload.updates) {
      if (update.type === "js-update") window.__mtHotUpdates?.push(update.path);
    }
  });
}

type LetterSnapshot = { text: string; icon?: string; classes: string };
type ChildSnapshot =
  | { index: number; classes: string; letters: LetterSnapshot[] }
  | { sibling: string };

/** The rendered #words children: words with their letters, plus newline siblings. */
function wordsSnapshot(): ChildSnapshot[] {
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
 * Px offset of the caret from where it should be: the start edge of the next
 * letter to type, or the end edge of the last letter (left/right, mirrored for
 * right to left words). Within a few px is on.
 */
function caretOffset(): { dx: number; dy: number } | undefined {
  const caret = document.querySelector("#caret");
  const letters = document.querySelectorAll("#words .word.active letter");
  if (caret === null || letters.length === 0) return undefined;
  const index = getCurrentInput().length;
  const target = (letters[index] ?? letters[letters.length - 1]) as Element;
  const targetRect = target.getBoundingClientRect();
  const caretRect = caret.getBoundingClientRect();
  const isRtl = getComputedStyle(target).direction === "rtl";
  const atStart = letters[index] !== undefined;
  const targetX = atStart !== isRtl ? targetRect.left : targetRect.right;
  return {
    dx: Math.round(caretRect.left - targetX),
    dy: Math.round(caretRect.top - targetRect.top),
  };
}

/** Starts a custom test with `text`, as the custom text modal's simple mode. */
async function setCustomText(text: string): Promise<void> {
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
  await restartTest();
}

/**
 * Layout problems on the test page, empty when it's laid out right: the active
 * word inside the words wrapper, the caret and the words input on it, three
 * full lines (unless all lines are shown), the tape anchor at the tape margin.
 */
function checkLayout(): string[] {
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
    // dynamic lists (presets, tags, custom themes) fill in on open
    command.subgroup?.beforeList?.();
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
async function runCommand(id: string, input?: string): Promise<void> {
  // lazy: the lists open indexedDB on import, expose loads in jsdom tests
  const { commands } = await import("../commandline/lists");
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

function findSignal(name: string): (typeof trackedSignals)[number] {
  const matches = trackedSignals.filter((s) => s.name === name);
  if (matches.length === 0) {
    throw new Error(`No tracked signal named "${name}"`);
  }
  if (matches.length > 1) {
    throw new Error(
      `${matches.length} signals named "${name}": ${matches.map((s) => s.source).join(", ")}`,
    );
  }
  return matches[0] as (typeof trackedSignals)[number];
}

const mt = {
  navigate,
  getRoutePage,
  /** Whether a navigation is in progress (the loading page may cover the page). */
  isNavigating: (): boolean => getRouter()?.state.status === "pending",
  /** Turns intent preloading (hovered links) off or back on. */
  setPreloading,
  getConfig,
  setConfig,
  showModal,
  hideModal,
  restartTest,
  typeText,
  compose,
  wordsSnapshot,
  caretOffset,
  checkLayout,
  runCommand,
  setCustomText,
  /** Signs in with the QUICK_LOGIN_* account from the frontend .env. */
  quickLogin,
  /**
   * Modules hot-updated since the page loaded. Not empty: the page may hold
   * stale module state, reload before measuring.
   */
  hotUpdates: (): string[] => [...(window.__mtHotUpdates ?? [])],
  /** List tracked signals, optionally filtered by substring of name or source. */
  signals: (filter = "") =>
    trackedSignals
      .filter((s) => s.name.includes(filter) || s.source.includes(filter))
      .map((s) => ({ name: s.name, source: s.source, value: s.peek() })),
  getSignal: (name: string) => findSignal(name).peek(),
  setSignal: (name: string, value: unknown) => findSignal(name).set(value),
};

declare global {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- interface merging
  interface Window {
    __mt: typeof mt;
    __mtHotUpdates?: string[];
  }
}

window.__mt = mt;
