import { LayoutObject } from "@monkeytype/schemas/layouts";

import { Keycode } from "../constants/keys";
import { layoutKeyToKeycode } from "./key-converter";
import { isLetter } from "./strings";

export const FingerNames = [
  "leftPinky",
  "leftRing",
  "leftMiddle",
  "leftIndex",
  "rightIndex",
  "rightMiddle",
  "rightRing",
  "rightPinky",
] as const;

export type FingerName = (typeof FingerNames)[number];

export const FingerDisplayNames: Record<FingerName, string> = {
  leftPinky: "pinky",
  leftRing: "ring",
  leftMiddle: "middle",
  leftIndex: "index",
  rightIndex: "index",
  rightMiddle: "middle",
  rightRing: "ring",
  rightPinky: "pinky",
};

export const FingerFullNames: Record<FingerName, string> = {
  leftPinky: "left pinky",
  leftRing: "left ring",
  leftMiddle: "left middle",
  leftIndex: "left index",
  rightIndex: "right index",
  rightMiddle: "right middle",
  rightRing: "right ring",
  rightPinky: "right pinky",
};

// standard touch typing finger ownership by physical key position. angle mod
// style fingerings (used with some *_iso layouts) are not modeled - those
// layouts get the standard physical-column interpretation.
const keycodeFingers: Partial<Record<Keycode, FingerName>> = {
  Backquote: "leftPinky",
  Digit1: "leftPinky",
  Digit2: "leftRing",
  Digit3: "leftMiddle",
  Digit4: "leftIndex",
  Digit5: "leftIndex",
  Digit6: "rightIndex",
  Digit7: "rightIndex",
  Digit8: "rightMiddle",
  Digit9: "rightRing",
  Digit0: "rightPinky",
  Minus: "rightPinky",
  Equal: "rightPinky",
  KeyQ: "leftPinky",
  KeyW: "leftRing",
  KeyE: "leftMiddle",
  KeyR: "leftIndex",
  KeyT: "leftIndex",
  KeyY: "rightIndex",
  KeyU: "rightIndex",
  KeyI: "rightMiddle",
  KeyO: "rightRing",
  KeyP: "rightPinky",
  BracketLeft: "rightPinky",
  BracketRight: "rightPinky",
  Backslash: "rightPinky",
  KeyA: "leftPinky",
  KeyS: "leftRing",
  KeyD: "leftMiddle",
  KeyF: "leftIndex",
  KeyG: "leftIndex",
  KeyH: "rightIndex",
  KeyJ: "rightIndex",
  KeyK: "rightMiddle",
  KeyL: "rightRing",
  Semicolon: "rightPinky",
  Quote: "rightPinky",
  IntlBackslash: "leftPinky",
  KeyZ: "leftPinky",
  KeyX: "leftRing",
  KeyC: "leftMiddle",
  KeyV: "leftIndex",
  KeyB: "leftIndex",
  KeyN: "rightIndex",
  KeyM: "rightIndex",
  Comma: "rightMiddle",
  Period: "rightRing",
  Slash: "rightPinky",
};

/** the layout name to load for a given config value */
export function resolveLayoutName(layout: string): string {
  return layout === "default" ? "qwerty" : layout;
}

/**
 * Derives which letters each finger is responsible for from a layout, using
 * standard touch typing conventions. Key positions are resolved through the
 * shared layoutKeyToKeycode converter (which owns the iso row quirks). Only
 * letters are included - digits, symbols and space (thumbs) are ignored.
 */
export function getFingerLetters(
  layout: LayoutObject,
): Record<FingerName, string[]> {
  const result = Object.fromEntries(
    FingerNames.map((finger) => [finger, [] as string[]]),
  ) as Record<FingerName, string[]>;

  const rows = [
    layout.keys.row1,
    layout.keys.row2,
    layout.keys.row3,
    layout.keys.row4,
  ];
  for (const row of rows) {
    for (const keyChars of row) {
      for (const char of keyChars) {
        if (!isLetter(char)) continue;
        const keycode = layoutKeyToKeycode(char, layout);
        // letter positions the converter can't name (right-edge extras like
        // the iso key next to enter) are pinky territory
        const finger =
          (keycode === undefined ? undefined : keycodeFingers[keycode]) ??
          "rightPinky";
        const lower = char.toLowerCase();
        if (!result[finger].includes(lower)) {
          result[finger].push(lower);
        }
      }
    }
  }

  return result;
}

/** counts letters in a word and how many of them satisfy the target check */
function countLetters(
  lowercaseWord: string,
  isTarget: (char: string) => boolean,
): { letters: number; hits: number } {
  let letters = 0;
  let hits = 0;
  for (const char of lowercaseWord) {
    if (!isLetter(char)) continue;
    letters++;
    if (isTarget(char)) hits++;
  }
  return { letters, hits };
}

/**
 * fraction of a word's letters that are typed with the target fingers.
 * non-letter characters are ignored, words without letters score 0.
 */
export function scoreWord(word: string, targetLetters: Set<string>): number {
  const { letters, hits } = countLetters(word.toLowerCase(), (char) =>
    targetLetters.has(char),
  );
  if (letters === 0) return 0;
  return hits / letters;
}

/**
 * short deterministic drill tokens for a letter that has no (or few) real
 * words in the language, combined with the other letters being trained
 */
export function buildDrillWords(
  letter: string,
  otherLetters: string[],
  count: number,
): string[] {
  const drills: string[] = [];
  if (otherLetters.length === 0) {
    drills.push(letter.repeat(2), letter.repeat(3), letter.repeat(4));
  } else {
    const patterns = [
      (other: string): string => `${letter}${other}`,
      (other: string): string => `${other}${letter}`,
      (other: string): string => `${letter}${other}${letter}`,
      (other: string): string => `${other}${letter}${other}`,
    ];
    for (const pattern of patterns) {
      for (const other of otherLetters) {
        drills.push(pattern(other));
      }
    }
  }
  return drills.slice(0, Math.max(0, count));
}

type PoolEntry = { word: string; density: number; score: number };

/** insert into an array kept sorted by density desc, score desc, capped */
function boundedInsert(
  bucket: PoolEntry[],
  entry: PoolEntry,
  cap: number,
): void {
  if (
    bucket.length === cap &&
    (bucket[cap - 1] as PoolEntry).density >= entry.density
  ) {
    return;
  }
  let low = 0;
  let high = bucket.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    const other = bucket[mid] as PoolEntry;
    if (
      other.density > entry.density ||
      (other.density === entry.density && other.score >= entry.score)
    ) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  bucket.splice(low, 0, entry);
  if (bucket.length > cap) bucket.pop();
}

/**
 * Builds a training word pool biased towards the target fingers. The pool is
 * built per target letter so that rare letters (q, z, ...) get the same share
 * of the pool as common ones (a, e, ...) instead of being crowded out by
 * whatever letter happens to be frequent in the language. Within a letter's
 * share, words denser in that letter rank higher, words that exercise the
 * target fingers more overall are repeated more often, and letters the
 * language barely covers are topped up with short drills (reported in
 * drilledLetters so the caller can tell the user).
 */
export function buildTrainingPool(
  words: string[],
  targetLetters: Set<string>,
  poolSize = 100,
): { pool: string[]; drilledLetters: string[] } {
  const letters = [...targetLetters];
  if (letters.length === 0) return { pool: [], drilledLetters: [] };
  const perLetter = Math.max(1, Math.ceil(poolSize / letters.length));

  const letterIndex = new Map(letters.map((letter, i) => [letter, i]));
  const buckets: PoolEntry[][] = letters.map(() => []);
  const counts = new Array<number>(letters.length);

  // single pass over the word list, keeping a bounded top-perLetter bucket
  // per letter, so huge languages don't allocate or sort per-letter copies
  for (const word of words) {
    const lower = word.toLowerCase();
    counts.fill(0);
    let letterCount = 0;
    let targetCount = 0;
    for (const char of lower) {
      if (!isLetter(char)) continue;
      letterCount++;
      const index = letterIndex.get(char);
      if (index !== undefined) {
        counts[index] = (counts[index] as number) + 1;
        targetCount++;
      }
    }
    if (letterCount === 0 || targetCount === 0) continue;
    const score = targetCount / letterCount;
    for (let i = 0; i < letters.length; i++) {
      const count = counts[i] as number;
      if (count === 0) continue;
      boundedInsert(
        buckets[i] as PoolEntry[],
        { word, density: count / letterCount, score },
        perLetter,
      );
    }
  }

  const pool: string[] = [];
  const drilledLetters: string[] = [];
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i] as string;
    const bucket = buckets[i] as PoolEntry[];

    // when the language barely covers a letter, top the bucket up with
    // short drills so the letter still gets trained
    const minFill = Math.min(8, perLetter);
    if (bucket.length < minFill) {
      drilledLetters.push(letter);
      const others = letters.filter((l) => l !== letter);
      const drills = buildDrillWords(letter, others, minFill - bucket.length);
      for (const word of drills) {
        bucket.push({
          word,
          density: 1,
          score: scoreWord(word, targetLetters),
        });
      }
    }

    for (const { word, score } of bucket) {
      // weight 1..5 depending on how focused the word is on the target fingers
      const weight = 1 + Math.round(score * 4);
      for (let j = 0; j < weight; j++) {
        pool.push(word);
      }
    }
  }
  return { pool, drilledLetters };
}

/**
 * Dilutes the training pool with normal words from the language so that on
 * average every `frequency`-th drawn word is a training word (1 = every word
 * is a training word). Languages are ordered by frequency, so cycling from
 * the start fills with the most common words.
 */
export function mixWithNormalWords(
  pool: string[],
  words: string[],
  frequency: number,
): string[] {
  const fillCount = pool.length * (Math.max(1, Math.round(frequency)) - 1);
  if (fillCount === 0 || words.length === 0) return pool;
  const filler: string[] = [];
  for (let i = 0; i < fillCount; i++) {
    filler.push(words[i % words.length] as string);
  }
  return [...pool, ...filler];
}
