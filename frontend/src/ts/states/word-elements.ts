/**
 * Rendered word elements by word index, registered by the Word component
 * while mounted. Lets imperative code (caret, layout) find a word without
 * querying the DOM.
 *
 * Exposes the whole element because some callers still write to it: hints
 * (.hints container) and break-joining (classes/styles). Once those move into
 * the component, narrow this to read-only measurements.
 */
const wordElements = new Map<number, HTMLElement>();

export function registerWordElement(index: number, el: HTMLElement): void {
  wordElements.set(index, el);
}

export function unregisterWordElement(index: number, el: HTMLElement): void {
  // a remount may have registered a new element already
  if (wordElements.get(index) === el) wordElements.delete(index);
}

/** The word's element, as of the last words flush. */
export function getWordElement(index: number): HTMLElement | undefined {
  return wordElements.get(index);
}

/** The elements of a word's line break (.beforeNewline/.newline/.afterNewline). */
export type LineBreakElements = {
  before: HTMLElement;
  after: HTMLElement;
};

/**
 * Rendered line break elements by the index of the word ending the line,
 * registered by the Words component while mounted.
 */
const lineBreakElements = new Map<number, LineBreakElements>();

export function registerLineBreakElements(
  index: number,
  els: LineBreakElements,
): void {
  lineBreakElements.set(index, els);
}

export function unregisterLineBreakElements(
  index: number,
  els: LineBreakElements,
): void {
  // a remount may have registered new elements already
  if (lineBreakElements.get(index) === els) lineBreakElements.delete(index);
}

/** The line break ending the word's line, as of the last words flush. */
export function getLineBreakElements(
  index: number,
): LineBreakElements | undefined {
  return lineBreakElements.get(index);
}
