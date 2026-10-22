import { batch } from "solid-js";
import { createStore, produce } from "solid-js/store";

/**
 * Display state of the test words (#words). A view cache: the event log stays
 * the source of truth for input, TestWords for the words themselves.
 *
 * Writers (input path) only touch a plain buffer. One shared animation frame
 * applies the buffer to the reactive store inside a batch, then runs the
 * registered layout hook against the updated DOM.
 *
 * Exception: the first rendered/tape hidden indices are only raised by layout
 * code (line jump, tape scroll) and apply immediately, so it can measure the
 * result.
 */

export type WordFlags = {
  isTyped: boolean;
  isIncorrect: boolean;
};

export type RenderedWord = WordFlags & {
  index: number;
  text: string;
  input: string;
  /** in-progress IME composition, active word only */
  composition: string;
};

type WordsRenderState = {
  words: RenderedWord[];
  /** words below this index are not rendered */
  firstRenderedWordIndex: number;
  /**
   * tape mode: words below this index are not rendered either, except words
   * ending a line - they keep the line break
   */
  tapeHiddenBefore: number;
  renderedActiveWordIndex: number;
  /**
   * zen test: letters come from the input only. Fixed per test at reset, so a
   * mode change doesn't re-render the current words before the restart
   */
  rendersLettersFromInput: boolean;
  /**
   * fully right-to-left words get the wordRtl class (bidi override). Off when
   * direction is checked per letter or reversed. Fixed per test at reset
   */
  marksRtlWords: boolean;
};

const [store, setStore] = createStore<WordsRenderState>({
  words: [],
  firstRenderedWordIndex: 0,
  tapeHiddenBefore: 0,
  renderedActiveWordIndex: 0,
  rendersLettersFromInput: false,
  marksRtlWords: false,
});

/** Read-only reactive view for the Words component. */
export const wordsRenderState: Readonly<WordsRenderState> = store;

type Buffer = {
  truncateTo: number | undefined;
  appended: string[];
  inputs: Map<number, { input: string; composition: string }>;
  activeWordIndex: number | undefined;
  flags: Map<number, Partial<WordFlags>>;
};

function emptyBuffer(): Buffer {
  return {
    truncateTo: undefined,
    appended: [],
    inputs: new Map(),
    activeWordIndex: undefined,
    flags: new Map(),
  };
}

let buffer = emptyBuffer();
let pendingFrame: number | undefined;
let layoutHook: (() => void) | undefined;

/** Runs after every flush, once the DOM reflects the store. */
export function setLayoutHook(hook: (() => void) | undefined): void {
  layoutHook = hook;
}

function scheduleFlush(): void {
  if (pendingFrame !== undefined) return;
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = undefined;
    flushWordsRender();
  });
}

function cancelPendingFlush(): void {
  if (pendingFrame === undefined) return;
  cancelAnimationFrame(pendingFrame);
  pendingFrame = undefined;
}

function newWord(index: number, text: string): RenderedWord {
  return {
    index,
    text,
    input: "",
    composition: "",
    isTyped: false,
    isIncorrect: false,
  };
}

/** Applies the buffer now, then runs the layout hook. */
export function flushWordsRender(): void {
  cancelPendingFlush();
  const b = buffer;
  buffer = emptyBuffer();

  batch(() => {
    // 1. structure: truncate, then append
    setStore(
      "words",
      produce((words) => {
        if (b.truncateTo !== undefined && b.truncateTo < words.length) {
          words.length = b.truncateTo;
        }
        for (const text of b.appended) {
          words.push(newWord(words.length, text));
        }
      }),
    );
    // 2. letters
    for (const [index, { input, composition }] of b.inputs) {
      if (store.words[index] === undefined) continue;
      setStore("words", index, { input, composition });
    }
    // 3. active index, flags
    if (b.activeWordIndex !== undefined) {
      setStore("renderedActiveWordIndex", b.activeWordIndex);
    }
    for (const [index, flags] of b.flags) {
      if (store.words[index] === undefined) continue;
      setStore("words", index, flags);
    }
  });

  // 4. imperative layout against the updated DOM
  layoutHook?.();
}

function wordCount(): number {
  return (buffer.truncateTo ?? store.words.length) + buffer.appended.length;
}

/** Input written for a word that hasn't been flushed yet. */
export function getPendingWordInput(index: number): string | undefined {
  return buffer.inputs.get(index)?.input;
}

export function appendRenderedWord(text: string): void {
  buffer.appended.push(text);
  scheduleFlush();
}

export function setWordInput(
  index: number,
  input: string,
  composition = "",
): void {
  buffer.inputs.set(index, { input, composition });
  scheduleFlush();
}

export function setActiveWord(index: number): void {
  buffer.activeWordIndex = index;
  scheduleFlush();
}

export function setWordFlags(index: number, flags: Partial<WordFlags>): void {
  buffer.flags.set(index, { ...buffer.flags.get(index), ...flags });
  scheduleFlush();
}

/**
 * Stops rendering words below `index`. Not for the input path: renders
 * synchronously so the caller can measure the updated DOM.
 */
export function setFirstRenderedWordIndex(index: number): void {
  setStore("firstRenderedWordIndex", index);
}

/**
 * Tape mode: stops rendering words below `index`, except words ending a line.
 * Not for the input path, renders synchronously like setFirstRenderedWordIndex.
 */
export function setTapeHiddenBefore(index: number): void {
  setStore("tapeHiddenBefore", index);
}

/** Whether the word is followed by a line break (zen: typed newline). */
export function wordEndsLine(word: RenderedWord): boolean {
  return (store.rendersLettersFromInput ? word.input : word.text).includes(
    "\n",
  );
}

/** Whether the word is rendered, as of the last flush. */
export function isWordRendered(index: number): boolean {
  if (index < store.firstRenderedWordIndex) return false;
  if (index >= store.tapeHiddenBefore) return true;
  const word = store.words[index];
  return word !== undefined && wordEndsLine(word);
}

/** Drops all words from `length` on (zen backspace). */
export function truncateWords(length: number): void {
  if (length >= wordCount()) return;
  const committed = buffer.truncateTo ?? store.words.length;
  if (length < committed) {
    buffer.truncateTo = length;
    buffer.appended = [];
  } else {
    buffer.appended.length = length - committed;
  }
  for (const index of [...buffer.inputs.keys()]) {
    if (index >= length) buffer.inputs.delete(index);
  }
  for (const index of [...buffer.flags.keys()]) {
    if (index >= length) buffer.flags.delete(index);
  }
  scheduleFlush();
}

/** Cancels a pending flush, clears the buffer and empties the store. */
export function resetWordsRender(
  options: { zen?: boolean; marksRtlWords?: boolean } = {},
): void {
  cancelPendingFlush();
  buffer = emptyBuffer();
  setStore({
    words: [],
    firstRenderedWordIndex: 0,
    tapeHiddenBefore: 0,
    renderedActiveWordIndex: 0,
    rendersLettersFromInput: options.zen ?? false,
    marksRtlWords: options.marksRtlWords ?? false,
  });
}
