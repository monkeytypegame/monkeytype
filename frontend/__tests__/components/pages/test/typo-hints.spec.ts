import { describe, expect, it } from "vitest";

import {
  createTypoHints,
  mergeTypoHints,
  TypoHintBox,
} from "../../../../src/ts/components/pages/test/typo-hints";

/** letters 10px wide in one line from x=0, hints 6px wide (4px char + padding) */
function box(
  letterIndex: number,
  overrides?: Partial<TypoHintBox>,
): TypoHintBox {
  return {
    letterLeft: letterIndex * 10,
    letterWidth: 10,
    letterTop: 0,
    hintWidth: 6,
    ...overrides,
  };
}

describe("createTypoHints", () => {
  it("hints the typed char under each mistyped letter when indicating below", () => {
    expect(createTypoHints("word", "wxrz", "below")).toEqual([
      { letterIndex: 1, char: "x" },
      { letterIndex: 3, char: "z" },
    ]);
  });

  it("hints the expected char when indicating both ways", () => {
    expect(createTypoHints("word", "wx", "both")).toEqual([
      { letterIndex: 1, char: "o" },
    ]);
  });

  it("hints nothing unless typos are indicated below", () => {
    expect(createTypoHints("word", "wx", "off")).toEqual([]);
    expect(createTypoHints("word", "wx", "replace")).toEqual([]);
  });

  it("hints no extra letters", () => {
    expect(createTypoHints("word", "wordz", "below")).toEqual([]);
  });
});

describe("mergeTypoHints", () => {
  it("centers each hint under its letter while hints don't overlap", () => {
    const hints = [
      { letterIndex: 1, char: "x" },
      { letterIndex: 2, char: "y" },
    ];
    expect(mergeTypoHints(hints, [box(1), box(2)])).toEqual([
      { letterIndices: [1], chars: "x", left: 15 },
      { letterIndices: [2], chars: "y", left: 25 },
    ]);
  });

  it("merges overlapping hints of adjacent letters, centered under them", () => {
    const hints = [
      { letterIndex: 1, char: "x" },
      { letterIndex: 2, char: "y" },
    ];
    const wide = { hintWidth: 12 };
    expect(mergeTypoHints(hints, [box(1, wide), box(2, wide)])).toEqual([
      { letterIndices: [1, 2], chars: "xy", left: 20 },
    ]);
  });

  it("doesn't merge overlapping hints of letters that aren't adjacent", () => {
    const hints = [
      { letterIndex: 1, char: "x" },
      { letterIndex: 3, char: "y" },
    ];
    // letters 1 and 3 drawn next to each other, eg. a narrow letter 2
    const wide = { hintWidth: 12 };
    const boxes = [box(1, wide), box(3, { ...wide, letterLeft: 20 })];
    expect(mergeTypoHints(hints, boxes).map((h) => h.chars)).toEqual([
      "x",
      "y",
    ]);
  });

  it("doesn't merge hints of adjacent letters on different lines", () => {
    const hints = [
      { letterIndex: 1, char: "x" },
      { letterIndex: 2, char: "y" },
    ];
    const wide = { hintWidth: 12 };
    const boxes = [
      box(1, wide),
      box(2, { ...wide, letterLeft: 10, letterTop: 30 }),
    ];
    expect(mergeTypoHints(hints, boxes).map((h) => h.chars)).toEqual([
      "x",
      "y",
    ]);
  });

  it("merges again when a merged hint overlaps the hint before it", () => {
    const hints = [
      { letterIndex: 1, char: "x" },
      { letterIndex: 2, char: "y" },
      { letterIndex: 3, char: "z" },
    ];
    // 1 and 2 don't overlap, 2 and 3 do. Merged 2+3 is wide enough to
    // overlap 1
    const boxes = [
      box(1, { hintWidth: 12 }),
      box(2, { hintWidth: 8 }),
      box(3, { hintWidth: 14 }),
    ];
    expect(mergeTypoHints(hints, boxes)).toEqual([
      { letterIndices: [1, 2, 3], chars: "xyz", left: 25 },
    ]);
  });

  it("merges right-to-left letters, drawn from the right", () => {
    const hints = [
      { letterIndex: 0, char: "x" },
      { letterIndex: 1, char: "y" },
    ];
    const wide = { hintWidth: 12 };
    const boxes = [
      box(0, { ...wide, letterLeft: 20 }),
      box(1, { ...wide, letterLeft: 10 }),
    ];
    expect(mergeTypoHints(hints, boxes)).toEqual([
      { letterIndices: [0, 1], chars: "xy", left: 20 },
    ]);
  });
});
