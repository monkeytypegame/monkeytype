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
import { LETTER_SELECTOR } from "../states/word-elements";
import { hideModal, showModal } from "../states/modals";
import * as CustomText from "../test/custom-text";
import { getCurrentInput } from "../test/events/data";
import { restartTest } from "../test/test-logic";
import { quickLogin, signOut } from "./auth";
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
      letters: [...child.querySelectorAll(`:scope > ${LETTER_SELECTOR}`)].map(
        (letter) => ({
          text: letter.textContent ?? "",
          icon: letter.querySelector("i")?.className,
          classes: letter.className,
        }),
      ),
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
  const letters = document.querySelectorAll(
    `#words .word.active ${LETTER_SELECTOR}`,
  );
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
    const letters = active.querySelectorAll(LETTER_SELECTOR);
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

/**
 * Dev-only browser handle, read by agents before scripting (docs/AGENT_BROWSER.md).
 * Read app state through these members or the DOM: importing app modules from
 * an injected script loads a separate module instance with its own state.
 */
const mt = {
  /**
   * Client-side route change: `navigate({ to, params, search })`, or
   * `navigate({ href: "/settings?x=1" })` for a raw path.
   */
  navigate,
  /** Page name of the last resolved route ("loading" before the first or after a failed load). */
  getRoutePage,
  /** Whether a navigation is in progress (the loading page may cover the page). */
  isNavigating: (): boolean => getRouter()?.state.status === "pending",
  /**
   * Turns intent preloading (hovered/focused links run the next page's guards
   * and loaders) off or back on, no rebuild; resets on reload. Permanent
   * switch: `INTENT_PRELOADING` in `router/create-router.ts`.
   */
  setPreloading,
  /** The config store object, not a function: `getConfig.fontSize`. */
  getConfig,
  /**
   * Writes a config key. Doesn't restart the test (callers restart until T6b):
   * use `runCommand` when the restart matters.
   */
  setConfig,
  /** Opens a modal by `ModalId`. */
  showModal,
  /** Hides a modal by `ModalId`. */
  hideModal,
  /** Restarts the typing test. */
  restartTest,
  /**
   * Types through the real input handlers; `"\n"` is a line break, `"\b"` a
   * backspace. Paced with `msPerChar`, else all in one task.
   */
  typeText,
  /**
   * IME composition through the real input handlers: each update is the
   * composition so far (eg. `["k", "か"]`), the last one commits.
   */
  compose,
  wordsSnapshot,
  caretOffset,
  /** Run it after any change to the test UI. */
  checkLayout,
  /**
   * `setConfig` skips the commandline's out of focus blur, so reproduce
   * commandline bugs with this. Also `applyPreset<presetId>`, and booleans as
   * `True`/`False` (`setPunctuationFalse`).
   */
  runCommand,
  /** Starts a custom test with `text` (newlines become line breaks), as the custom text modal's simple mode. */
  setCustomText,
  /**
   * Signs in with the QUICK_LOGIN_* account from the frontend .env (same as
   * the DevOptions modal button); resolves once the account data is loaded,
   * rejects after 10s. Use it whenever a check needs an account: presets,
   * tags, results, sync.
   */
  quickLogin,
  /**
   * Signs out the current session; resolves once the app clears it, rejects
   * after 10s. No-op without a session.
   */
  signOut,
  /**
   * Modules hot-updated since the page loaded. Not empty: the page may hold
   * stale module state, reload before measuring.
   */
  hotUpdates: (): string[] => [...(window.__mtHotUpdates ?? [])],
  /**
   * Tracked Solid signals `{ name, source, value }`, optionally filtered by
   * substring of name or source. Not every signal is tracked: list before
   * `getSignal`.
   */
  signals: (filter = "") =>
    trackedSignals
      .filter((s) => s.name.includes(filter) || s.source.includes(filter))
      .map((s) => ({ name: s.name, source: s.source, value: s.peek() })),
  /** Reads a tracked signal by exact name. */
  getSignal: (name: string) => findSignal(name).peek(),
  /** Writes a tracked signal by exact name. */
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
