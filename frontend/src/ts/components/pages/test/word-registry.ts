/** The elements of a word's line break (.beforeNewline/.newline/.afterNewline). */
export type LineBreakElements = {
  before: HTMLElement;
  after: HTMLElement;
};

/**
 * Rendered word, letter and line break elements by word index, owned by the
 * Words component: its words and line breaks register while mounted, its
 * layout and caret find them without querying the DOM.
 */
export type WordRegistry = {
  /**
   * Registers word `index`'s element and its letters (an array the word keeps
   * filled with its rendered letters, in order); returns its unregister.
   */
  registerWord(
    index: number,
    el: HTMLElement,
    letters: readonly HTMLElement[],
  ): () => void;
  /** The word's element, as of the last words flush. */
  getWord(index: number): HTMLElement | undefined;
  /**
   * The word's rendered letters, as of the last words flush. Live: read it
   * again after the next flush instead of keeping it.
   */
  getLetters(index: number): readonly HTMLElement[] | undefined;
  /**
   * Registers the line break ending word `index`'s line; returns its
   * unregister.
   */
  registerLineBreak(index: number, els: LineBreakElements): () => void;
  /** The line break ending the word's line, as of the last words flush. */
  getLineBreak(index: number): LineBreakElements | undefined;
};

export function createWordRegistry(): WordRegistry {
  const words = new Map<
    number,
    { el: HTMLElement; letters: readonly HTMLElement[] }
  >();
  const lineBreaks = new Map<number, LineBreakElements>();

  /** Sets `key` to `value`; the returned unregister leaves a newer value. */
  function register<T>(map: Map<number, T>, key: number, value: T): () => void {
    map.set(key, value);
    return () => {
      // a remount may have registered a new element already
      if (map.get(key) === value) map.delete(key);
    };
  }

  return {
    registerWord: (index, el, letters) =>
      register(words, index, { el, letters }),
    getWord: (index) => words.get(index)?.el,
    getLetters: (index) => words.get(index)?.letters,
    registerLineBreak: (index, els) => register(lineBreaks, index, els),
    getLineBreak: (index) => lineBreaks.get(index),
  };
}
