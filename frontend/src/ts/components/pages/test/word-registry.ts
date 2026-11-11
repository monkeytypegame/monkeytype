/** The elements of a word's line break (.beforeNewline/.newline/.afterNewline). */
export type LineBreakElements = {
  before: HTMLElement;
  after: HTMLElement;
};

/**
 * Rendered word and line break elements by word index, owned by the Words
 * component: its words and line breaks register while mounted, its layout
 * finds them without querying the DOM.
 */
export type WordRegistry = {
  /** Registers word `index`'s element; returns its unregister. */
  registerWord(index: number, el: HTMLElement): () => void;
  /** The word's element, as of the last words flush. */
  getWord(index: number): HTMLElement | undefined;
  /**
   * Registers the line break ending word `index`'s line; returns its
   * unregister.
   */
  registerLineBreak(index: number, els: LineBreakElements): () => void;
  /** The line break ending the word's line, as of the last words flush. */
  getLineBreak(index: number): LineBreakElements | undefined;
};

export function createWordRegistry(): WordRegistry {
  const words = new Map<number, HTMLElement>();
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
    registerWord: (index, el) => register(words, index, el),
    getWord: (index) => words.get(index),
    registerLineBreak: (index, els) => register(lineBreaks, index, els),
    getLineBreak: (index) => lineBreaks.get(index),
  };
}
