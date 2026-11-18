import { describe, expect, it } from "vitest";

import {
  createWordRegistry,
  type MountedWord,
} from "../../../../src/ts/components/pages/test/word-registry";

/** A mounted word: `el` with its letters. */
function mountedWord(letters: HTMLElement[] = []): MountedWord {
  return {
    el: document.createElement("div"),
    getLetter: (index) => letters[index],
    getLetterCount: () => letters.length,
  };
}

describe("word registry", () => {
  it("finds registered words until they unregister", () => {
    const registry = createWordRegistry();
    const word = mountedWord([document.createElement("letter")]);
    const unregister = registry.registerWord(1, word);
    expect(registry.getWord(1)).toBe(word);
    expect(registry.getWord(0)).toBeUndefined();
    unregister();
    expect(registry.getWord(1)).toBeUndefined();
  });

  it("keeps a remount's word when the old one unregisters after it", () => {
    const registry = createWordRegistry();
    const newWord = mountedWord();
    const unregisterOld = registry.registerWord(1, mountedWord());
    registry.registerWord(1, newWord);
    unregisterOld();
    expect(registry.getWord(1)).toBe(newWord);
  });

  it("keeps a remount's line break when the old one unregisters after it", () => {
    const registry = createWordRegistry();
    const lineBreak = (): { before: HTMLElement; after: HTMLElement } => ({
      before: document.createElement("div"),
      after: document.createElement("div"),
    });
    const oldEls = lineBreak();
    const newEls = lineBreak();
    const unregisterOld = registry.registerLineBreak(1, oldEls);
    expect(registry.getLineBreak(1)).toBe(oldEls);
    registry.registerLineBreak(1, newEls);
    unregisterOld();
    expect(registry.getLineBreak(1)).toBe(newEls);
  });

  it("keeps words and line breaks apart", () => {
    const registry = createWordRegistry();
    registry.registerWord(1, mountedWord());
    expect(registry.getLineBreak(1)).toBeUndefined();
  });
});
