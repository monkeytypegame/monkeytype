import { z } from "zod";

import { cleanTypographySymbols } from "./strings";

export const LyricsFilterOptionsSchema = z.object({
  /** drop lines that are only a section tag, e.g. `[Chorus]` */
  removeSectionHeaders: z.boolean(),
  /** what to do with `()`, `[]`, `{}` */
  brackets: z.enum(["keep", "stripChars", "removeContent"]),
  /** remove characters like `* # @ ~ / \ | < > _ = + ^ %` */
  removeSpecialChars: z.boolean(),
  /** remove `. , ! ? : ; "` and dangling dashes. Keeps `'` and in-word `-` */
  removePunctuation: z.boolean(),
  /** curly quotes, long dashes, ellipsis -> ascii */
  normalizeTypography: z.boolean(),
  /** é -> e, ß -> ss, ç -> c */
  foldDiacritics: z.boolean(),
  /**
   * characters that `foldDiacritics` leaves alone, e.g. "ßäöü". Case
   * insensitive: "ä" also keeps "Ä".
   */
  keepChars: z.string(),
  lowercase: z.boolean(),
  /** collapse identical consecutive lines (repeated hooks) */
  removeRepeatedLines: z.boolean(),
  /** `enter`: user has to press enter at the end of each line */
  lineBreaks: z.enum(["space", "enter"]),
});

export type LyricsFilterOptions = z.infer<typeof LyricsFilterOptionsSchema>;

export const defaultLyricsFilterOptions: LyricsFilterOptions = {
  removeSectionHeaders: true,
  brackets: "removeContent",
  removeSpecialChars: true,
  removePunctuation: false,
  normalizeTypography: true,
  foldDiacritics: false,
  keepChars: "",
  lowercase: false,
  removeRepeatedLines: false,
  lineBreaks: "space",
};

const SECTION_HEADER = /^\s*\[[^\]]*\]\s*$/;
const BRACKET_PAIRS = /\([^()]*\)|\[[^[\]]*\]|\{[^{}]*\}/g;
const BRACKET_CHARS = /[()[\]{}]/g;

// letters, numbers, combining marks, whitespace and the basic punctuation set
const NOT_ALLOWED_SPECIAL = /[^\p{L}\p{N}\p{M}\s.,!?'":;-]/gu;

// latin combining marks (U+0300 - U+036F), written as escapes on purpose
const LATIN_COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

// letters that do not decompose into base letter + combining mark
const FOLD_MAP: Record<string, string> = {
  ß: "ss",
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  ø: "o",
  Ø: "O",
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
};

function removeBracketContent(text: string): string {
  // repeat so nested brackets like "(a (b))" are fully removed
  let previous: string;
  let current = text;
  do {
    previous = current;
    current = current.replace(BRACKET_PAIRS, "");
  } while (current !== previous);
  return current;
}

/**
 * What a single character becomes when accents are folded (é -> e, ç -> c,
 * ß -> ss). Returns the character itself if there is nothing to fold.
 */
export function getFoldReplacement(char: string): string {
  const mapped = FOLD_MAP[char];
  if (mapped !== undefined) return mapped;
  return char
    .normalize("NFD")
    .replace(LATIN_COMBINING_MARKS, "")
    .normalize("NFC");
}

function foldDiacritics(text: string, keep: ReadonlySet<string>): string {
  let result = "";
  // the text is NFC normalized, so accented letters are single characters
  for (const char of text) {
    result += keep.has(char.toLowerCase()) ? char : getFoldReplacement(char);
  }
  return result;
}

/**
 * Distinct (lowercase) characters in the text that accent folding would
 * change, sorted. Used to let the user pick which ones to keep.
 */
export function findFoldableChars(text: string): string[] {
  const found = new Set<string>();
  for (const char of text.normalize()) {
    if (getFoldReplacement(char) !== char) found.add(char.toLowerCase());
  }
  return [...found].sort((a, b) => a.localeCompare(b));
}

function removePunctuation(text: string): string {
  return text
    .replace(/[.,!?:;"]/g, "")
    .replace(/(^|\s)-+(?=\s|$)/g, "$1") // standalone dashes
    .replace(/-{2,}/g, " ");
}

function cleanLine(
  line: string,
  options: LyricsFilterOptions,
  keep: ReadonlySet<string>,
): string {
  let result = line;

  if (options.foldDiacritics) result = foldDiacritics(result, keep);

  if (options.removeSpecialChars) {
    result = result
      .replace(/&/g, " and ")
      .replace(/[/\\|]/g, " ")
      .replace(NOT_ALLOWED_SPECIAL, "");
  }

  if (options.removePunctuation) result = removePunctuation(result);
  if (options.lowercase) result = result.toLowerCase();

  return result.replace(/\s+/g, " ").trim();
}

/**
 * Turns raw lyrics into the text that is typed. Lines are joined with a plain
 * space, or with "\n " when `lineBreaks` is `enter` (same convention as the
 * custom text modal).
 */
export function filterLyrics(
  rawLyrics: string,
  options: LyricsFilterOptions,
): string {
  let text = rawLyrics.replace(/\r\n?/g, "\n").normalize();

  if (options.normalizeTypography) text = cleanTypographySymbols(text);
  text = text.replace(new RegExp("[\\u200B-\\u200D\\u2060\\uFEFF]", "g"), "");

  if (options.removeSectionHeaders) {
    text = text
      .split("\n")
      .filter((line) => !SECTION_HEADER.test(line))
      .join("\n");
  }

  if (options.brackets === "removeContent") {
    text = removeBracketContent(text);
  } else if (options.brackets === "stripChars") {
    text = text.replace(BRACKET_CHARS, "");
  }

  const keep = new Set(options.keepChars.normalize().toLowerCase());

  let lines = text
    .split("\n")
    .map((line) => cleanLine(line, options, keep))
    .filter((line) => line !== "");

  if (options.removeRepeatedLines) {
    lines = lines.filter(
      (line, i) =>
        i === 0 || line.toLowerCase() !== lines[i - 1]?.toLowerCase(),
    );
  }

  return lines.join(options.lineBreaks === "enter" ? "\n " : " ");
}

/** same split the custom text modal uses (space delimiter) */
export function lyricsToWords(
  rawLyrics: string,
  options: LyricsFilterOptions,
): string[] {
  return filterLyrics(rawLyrics, options)
    .split(" ")
    .filter((word) => word !== "");
}
