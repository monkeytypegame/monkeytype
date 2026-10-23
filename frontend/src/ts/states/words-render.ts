import { batch } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { createWordsRenderBuffer } from "./words-render-buffer";

/**
 * Display state of the test words (#words). A view cache: the event log stays
 * the source of truth for input, TestWords for the words themselves.
 *
 * Writers (input path) only touch a plain buffer. One shared animation frame
 * applies the buffer to the reactive store inside a batch, then runs the
 * registered layout hook against the updated DOM.
 *
 * Exception: the first rendered word/line break indices are only raised by
 * layout code (line jump, tape scroll) and apply immediately, so it can
 * measure the result.
 */

export type RenderedWord = {
  index: number;
  text: string;
  input: string;
  /** in-progress IME composition, active word only */
  composition: string;
  /** typed past (committed) */
  isTyped: boolean;
  /** followed by a line break (zen: typed newline) */
  endsLine: boolean;
};

type WordsRenderState = {
  words: RenderedWord[];
  /** words below this index are not rendered (line jump, tape scroll) */
  firstRenderedWordIndex: number;
  /**
   * line breaks of words below this index are not rendered (line jump). Tape
   * scroll hides words only, their line breaks keep the lines in place
   */
  firstRenderedLineBreakIndex: number;
  /**
   * hidden words keep their line breaks: set once a word ends a line this test
   * (zen: typed newline), stays set after zen backspace
   */
  keepsLineBreaks: boolean;
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
  firstRenderedLineBreakIndex: 0,
  keepsLineBreaks: false,
  renderedActiveWordIndex: 0,
  rendersLettersFromInput: false,
  marksRtlWords: false,
});

/** Read-only reactive view for the Words component. */
export const wordsRenderState: Readonly<WordsRenderState> = store;

const buffer = createWordsRenderBuffer();
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
    // zen: from the input
    endsLine: !store.rendersLettersFromInput && text.includes("\n"),
  };
}

/** Applies the buffer now, then runs the layout hook. */
export function flushWordsRender(): void {
  cancelPendingFlush();
  const b = buffer.take();

  batch(() => {
    let endsLine = false;
    // 1. structure: truncate, then append
    setStore(
      "words",
      produce((words) => {
        if (b.truncateTo !== undefined && b.truncateTo < words.length) {
          words.length = b.truncateTo;
        }
        for (const text of b.appended) {
          const word = newWord(words.length, text);
          endsLine ||= word.endsLine;
          words.push(word);
        }
      }),
    );
    // 2. letters
    for (const [index, { input, composition }] of b.inputs) {
      if (store.words[index] === undefined) continue;
      if (store.rendersLettersFromInput) {
        const inputEndsLine = input.includes("\n");
        endsLine ||= inputEndsLine;
        setStore("words", index, {
          input,
          composition,
          endsLine: inputEndsLine,
        });
      } else {
        setStore("words", index, { input, composition });
      }
    }
    if (endsLine && !store.keepsLineBreaks) setStore("keepsLineBreaks", true);
    // 3. active index, typed
    if (b.activeWordIndex !== undefined) {
      setStore("renderedActiveWordIndex", b.activeWordIndex);
    }
    for (const [index, isTyped] of b.typed) {
      if (store.words[index] === undefined) continue;
      setStore("words", index, "isTyped", isTyped);
    }
  });

  // 4. imperative layout against the updated DOM
  layoutHook?.();
}

/** Input written for a word that hasn't been flushed yet. */
export function getPendingWordInput(index: number): string | undefined {
  return buffer.getPendingInput(index);
}

export function appendRenderedWord(text: string): void {
  buffer.append(text);
  scheduleFlush();
}

export function setWordInput(
  index: number,
  input: string,
  composition = "",
): void {
  buffer.setInput(index, input, composition);
  scheduleFlush();
}

export function setActiveWord(index: number): void {
  buffer.setActiveWord(index);
  scheduleFlush();
}

export function setWordTyped(index: number, isTyped: boolean): void {
  buffer.setTyped(index, isTyped);
  scheduleFlush();
}

/**
 * Tape scroll: stops rendering words below `index`, keeping their line breaks.
 * Not for the input path: renders synchronously so the caller can measure the
 * updated DOM.
 */
export function setFirstRenderedWordIndex(index: number): void {
  setStore("firstRenderedWordIndex", (current) => Math.max(current, index));
}

/**
 * Line jump: stops rendering words below `index` and their line breaks. Not
 * for the input path, renders synchronously like setFirstRenderedWordIndex.
 */
export function setFirstRenderedLine(index: number): void {
  batch(() => {
    setFirstRenderedWordIndex(index);
    setStore("firstRenderedLineBreakIndex", (current) =>
      Math.max(current, index),
    );
  });
}

/** Whether the word is rendered, as of the last flush. Reactive. */
export function isWordRendered(index: number): boolean {
  return index >= store.firstRenderedWordIndex;
}

/**
 * First word with anything mounted: its word, or only its line break (tape).
 * Reactive.
 */
export function firstMountedIndex(): number {
  // without line breaks, hidden words mount nothing
  return store.keepsLineBreaks
    ? store.firstRenderedLineBreakIndex
    : store.firstRenderedWordIndex;
}

/** Drops all words from `length` on (zen backspace). */
export function truncateWords(length: number): void {
  if (!buffer.truncate(length, store.words.length)) return;
  scheduleFlush();
}

/** Cancels a pending flush, clears the buffer and empties the store. */
export function resetWordsRender(
  options: { zen?: boolean; marksRtlWords?: boolean } = {},
): void {
  cancelPendingFlush();
  buffer.clear();
  setStore({
    words: [],
    firstRenderedWordIndex: 0,
    firstRenderedLineBreakIndex: 0,
    keepsLineBreaks: false,
    renderedActiveWordIndex: 0,
    rendersLettersFromInput: options.zen ?? false,
    marksRtlWords: options.marksRtlWords ?? false,
  });
}
