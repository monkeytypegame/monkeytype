/** The elements of a word's line break (.beforeNewline/.newline/.afterNewline). */
export type LineBreakElements = {
  before: HTMLElement;
  after: HTMLElement;
};

/**
 * A word on screen: its element and letters. Letters are live (as of the
 * last words flush): read them when needed, don't keep them across flushes.
 */
export type MountedWord = {
  readonly el: HTMLElement;
  /** Letter `index`, undefined past the last one. */
  getLetter(index: number): HTMLElement | undefined;
  getLetterCount(): number;
};

/**
 * Rendered word, letter and line break elements by word index, owned by the
 * Words component: its words and line breaks register while mounted, its
 * layout and carets find them without querying the DOM.
 */
export type WordRegistry = {
  /** Registers word `index` while it's mounted; returns its unregister. */
  registerWord(index: number, word: MountedWord): () => void;
  /** The mounted word, as of the last words flush. */
  getWord(index: number): MountedWord | undefined;
  /**
   * Registers the line break ending word `index`'s line; returns its
   * unregister.
   */
  registerLineBreak(index: number, els: LineBreakElements): () => void;
  /** The line break ending the word's line, as of the last words flush. */
  getLineBreak(index: number): LineBreakElements | undefined;
};

export function createWordRegistry(): WordRegistry {
  const words = new Map<number, MountedWord>();
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
    registerWord: (index, word) => register(words, index, word),
    getWord: (index) => words.get(index),
    registerLineBreak: (index, els) => register(lineBreaks, index, els),
    getLineBreak: (index) => lineBreaks.get(index),
  };
}
