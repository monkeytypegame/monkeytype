import type { IndicateTypos } from "@monkeytype/schemas/configs";

import { splitIntoCharacters } from "../../../utils/strings";

/**
 * Typo hints: the small chars shown under mistyped letters. Pure, the
 * TypoHints component measures the rendered letters and hints for the merge.
 */

export type TypoHint = {
  letterIndex: number;
  char: string;
};

/**
 * One typo hint per mistyped letter, in letter order. Below: the hint shows
 * the typed char. Both: the letter shows the typed char, the hint the expected
 * one. Extra letters get no hint.
 */
export function createTypoHints(
  text: string,
  input: string,
  indicateTypos: IndicateTypos,
): TypoHint[] {
  if (indicateTypos !== "below" && indicateTypos !== "both") return [];
  const wordChars = splitIntoCharacters(text);
  const inputChars = splitIntoCharacters(input);
  const hints: TypoHint[] = [];
  for (let i = 0; i < inputChars.length; i++) {
    const typed = inputChars[i] as string;
    const expected = wordChars[i];
    if (expected === undefined || expected === typed) continue;
    hints.push({
      letterIndex: i,
      char: indicateTypos === "both" ? expected : typed,
    });
  }
  return hints;
}

/** measured layout of a single-letter hint and its letter, in px */
export type TypoHintBox = {
  letterLeft: number;
  letterWidth: number;
  letterTop: number;
  hintWidth: number;
};

export type MergedTypoHint = {
  letterIndices: number[];
  chars: string;
  /** center of the hint, relative to the word */
  left: number;
};

/** horizontal padding of a hint on each side, in px (`p-px` in TypoHints) */
export const TYPO_HINT_PADDING = 1;

type Block = {
  letterIndices: number[];
  chars: string;
  top: number;
  /** horizontal extent of the block's letters */
  lettersStart: number;
  lettersEnd: number;
  width: number;
};

function centerOf(block: Block): number {
  return (block.lettersStart + block.lettersEnd) / 2;
}

function canMerge(a: Block, b: Block): boolean {
  const aLast = a.letterIndices[a.letterIndices.length - 1] as number;
  const adjacent = b.letterIndices[0] === aLast + 1;
  if (!adjacent || a.top !== b.top) return false;
  // hints are centered: they overlap when their centers are closer than half
  // their widths. Independent of direction, so right-to-left needs no flip
  return Math.abs(centerOf(a) - centerOf(b)) < (a.width + b.width) / 2;
}

function merge(a: Block, b: Block): Block {
  return {
    letterIndices: [...a.letterIndices, ...b.letterIndices],
    chars: a.chars + b.chars,
    top: a.top,
    lettersStart: Math.min(a.lettersStart, b.lettersStart),
    lettersEnd: Math.max(a.lettersEnd, b.lettersEnd),
    // one hint's padding instead of two
    width: a.width + b.width - 2 * TYPO_HINT_PADDING,
  };
}

/**
 * Merges hints of adjacent letters on the same line whose hints would overlap.
 * A merged hint can overlap the one before it, so merging repeats backwards.
 * `boxes[i]` measures `hints[i]` rendered as a single-letter hint.
 */
export function mergeTypoHints(
  hints: TypoHint[],
  boxes: TypoHintBox[],
): MergedTypoHint[] {
  const blocks: Block[] = [];
  hints.forEach((hint, i) => {
    const box = boxes[i] as TypoHintBox;
    blocks.push({
      letterIndices: [hint.letterIndex],
      chars: hint.char,
      top: box.letterTop,
      lettersStart: box.letterLeft,
      lettersEnd: box.letterLeft + box.letterWidth,
      width: box.hintWidth,
    });
    while (blocks.length >= 2) {
      const last = blocks[blocks.length - 1] as Block;
      const previous = blocks[blocks.length - 2] as Block;
      if (!canMerge(previous, last)) break;
      blocks.splice(-2, 2, merge(previous, last));
    }
  });
  return blocks.map((block) => ({
    letterIndices: block.letterIndices,
    chars: block.chars,
    left: centerOf(block),
  }));
}
