import { batch, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { createFrameBuffer } from "../utils/frame-buffer";

/**
 * Display state of the test words (#words). A view cache: the event log stays
 * the source of truth for input, TestWords for the words themselves.
 *
 * Writers (input path) only touch a plain buffer. One shared animation frame
 * applies the buffer to the reactive store inside a batch, then runs the
 * registered layout hook against the updated DOM.
 *
 * Exceptions, applied immediately: the first rendered word/line break indices
 * are only raised by layout code (line jump, tape scroll), so it can measure
 * the result. The typo hints layout version is only bumped outside the input
 * path (font, resize, layout).
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

const [typoHintsLayoutVersion, setTypoHintsLayoutVersion] = createSignal(0);

/** Changes whenever typo hints have to re-measure their letters. */
export { typoHintsLayoutVersion };

/**
 * Letter widths may have changed (font, resize): typo hints re-measure. Not
 * part of the input path, applies immediately.
 */
export function invalidateTypoHintsLayout(): void {
  setTypoHintsLayoutVersion((version) => version + 1);
}

type Buffer = {
  truncateTo: number | undefined;
  appended: string[];
  inputs: Map<number, { input: string; composition: string }>;
  activeWordIndex: number | undefined;
  typed: Map<number, boolean>;
};

const buffer = createFrameBuffer<Buffer>(
  () => ({
    truncateTo: undefined,
    appended: [],
    inputs: new Map(),
    activeWordIndex: undefined,
    typed: new Map(),
  }),
  applyBuffer,
);
let layoutHook: (() => void) | undefined;

/** Runs after every flush, once the DOM reflects the store. */
export function setLayoutHook(hook: (() => void) | undefined): void {
  layoutHook = hook;
}

/** Applies the buffer now, then runs the layout hook. */
export function flushWordsRender(): void {
  buffer.flush();
}

function applyBuffer(b: Buffer): void {
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
          // zen: from the input
          const wordEndsLine =
            !store.rendersLettersFromInput && text.includes("\n");
          endsLine ||= wordEndsLine;
          words.push({
            index: words.length,
            text,
            input: "",
            composition: "",
            isTyped: false,
            endsLine: wordEndsLine,
          });
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
  return buffer.peek().inputs.get(index)?.input;
}

export function appendRenderedWord(text: string): void {
  buffer.write((b) => b.appended.push(text));
}

export function setWordInput(
  index: number,
  input: string,
  composition = "",
): void {
  buffer.write((b) => b.inputs.set(index, { input, composition }));
}

export function setActiveWord(index: number): void {
  buffer.write((b) => (b.activeWordIndex = index));
}

export function setWordTyped(index: number, isTyped: boolean): void {
  buffer.write((b) => b.typed.set(index, isTyped));
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
  const pending = buffer.peek();
  const committed = pending.truncateTo ?? store.words.length;
  if (length >= committed + pending.appended.length) return;
  buffer.write((b) => {
    if (length < committed) {
      b.truncateTo = length;
      b.appended = [];
    } else {
      b.appended.length = length - committed;
    }
    for (const index of [...b.inputs.keys()]) {
      if (index >= length) b.inputs.delete(index);
    }
    for (const index of [...b.typed.keys()]) {
      if (index >= length) b.typed.delete(index);
    }
  });
}

/** Cancels a pending flush, clears the buffer and empties the store. */
export function resetWordsRender(
  options: { zen?: boolean; marksRtlWords?: boolean } = {},
): void {
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
