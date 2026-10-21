/**
 * Rendered word elements by word index, registered by the Word component
 * while mounted. Lets imperative code (caret, layout) find a word without
 * querying the DOM.
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
