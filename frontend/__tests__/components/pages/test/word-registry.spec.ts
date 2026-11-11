import { describe, expect, it } from "vitest";

import { createWordRegistry } from "../../../../src/ts/components/pages/test/word-registry";

describe("word registry", () => {
  it("finds registered words until they unregister", () => {
    const registry = createWordRegistry();
    const el = document.createElement("div");
    const unregister = registry.registerWord(1, el);
    expect(registry.getWord(1)).toBe(el);
    expect(registry.getWord(0)).toBeUndefined();
    unregister();
    expect(registry.getWord(1)).toBeUndefined();
  });

  it("keeps a remount's word when the old one unregisters after it", () => {
    const registry = createWordRegistry();
    const oldEl = document.createElement("div");
    const newEl = document.createElement("div");
    const unregisterOld = registry.registerWord(1, oldEl);
    registry.registerWord(1, newEl);
    unregisterOld();
    expect(registry.getWord(1)).toBe(newEl);
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
    registry.registerWord(1, document.createElement("div"));
    expect(registry.getLineBreak(1)).toBeUndefined();
  });
});
