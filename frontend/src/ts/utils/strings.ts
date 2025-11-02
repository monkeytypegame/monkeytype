import { Language } from "@monkeytype/schemas/languages";

/**
 * Removes accents from a string.
 * https://ricardometring.com/javascript-replace-special-characters
 * @param str The input string.
 * @returns A new string with accents removed.
 */
export function replaceSpecialChars(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
}

/**
 * Converts a camelCase string to words separated by spaces.
 * @param str The camelCase string to convert.
 * @returns The string with spaces inserted before capital letters and converted to lowercase.
 */
export function camelCaseToWords(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
}

/**
 * Returns the last character of a string.
 * @param word The input string.
 * @returns The last character of the input string, or an empty string if the input is empty.
 */
export function getLastChar(word: string): string {
  try {
    return word.charAt(word.length - 1);
  } catch {
    return "";
  }
}

/**
 * Replaces a character at a specific index in a string.
 * @param str The input string.
 * @param index The index at which to replace the character.
 * @param chr The character to insert at the specified index.
 * @returns A new string with the character at the specified index replaced.
 */
export function replaceCharAt(str: string, index: number, chr: string): string {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

/**
 * Capitalizes the first letter of each word in a string.
 * @param str The input string.
 * @returns A new string with the first letter of each word capitalized.
 */
export function capitalizeFirstLetterOfEachWord(str: string): string {
  return str
    .split(/ +/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

/**
 * Capitalizes the first letter of a string.
 * @param str The input string.
 * @returns A new string with the first letter capitalized.
 */
export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * @param text String to split
 * @param delimiters Single character delimiters.
 */
export function splitByAndKeep(text: string, delimiters: string[]): string[] {
  const splitString: string[] = [];
  let currentToken: string[] = [];
  const delimiterSet = new Set<string>(delimiters);

  for (const char of text) {
    if (delimiterSet.has(char)) {
      if (currentToken.length > 0) {
        splitString.push(currentToken.join(""));
      }
      splitString.push(char);
      currentToken = [];
    } else {
      currentToken.push(char);
    }
  }

  if (currentToken.length > 0) {
    splitString.push(currentToken.join(""));
  }

  return splitString;
}

/**
 * Highlights all occurrences of specified words within a given text.
 * Each match is wrapped in a <span class="highlight"> element.
 * Matches are ignored if they appear as part of a larger word
 * not included in the matches array.
 * @param text The full text in which to highlight words.
 * @param matches An array of words to highlight.
 * @return The full text with all matching words highlighted.
 */
export function highlightMatches(text: string, matches: string[]): string {
  matches = matches.filter((match) => match !== "");
  if (matches.length === 0) return text;

  // matches that don't have a letter before or after them
  const pattern = new RegExp(
    `(?<!\\p{L})(?:${matches.join("|")})(?!\\p{L})`,
    "gu"
  );

  return text.replace(pattern, '<span class="highlight">$&</span>');
}

/**
 * Returns a display string for the given language, optionally removing the size indicator.
 * @param language The language string.
 * @param noSizeString Whether to remove the size indicator from the language string. Default is false.
 * @returns A display string for the language.
 */
export function getLanguageDisplayString(
  language: Language,
  noSizeString = false
): string {
  let out = "";
  if (noSizeString) {
    out = removeLanguageSize(language);
  } else {
    out = language;
  }
  return out.replace(/_/g, " ");
}

/**
 * Removes the size indicator from a language string.
 * @param language The language string.
 * @returns The language string with the size indicator removed.
 */
export function removeLanguageSize(language: Language): Language {
  return language.replace(/_\d*k$/g, "") as Language;
}

/**
 * Removes fancy typography symbols from a string.
 * @param textToClean
 * @returns Cleaned text.
 */
export function cleanTypographySymbols(textToClean: string): string {
  const specials = {
    "“": '"', // &ldquo;	&#8220;
    "”": '"', // &rdquo;	&#8221;
    "„": '"', // &bdquo;	&#8222;
    "’": "'", // &lsquo;	&#8216;
    "‘": "'", // &rsquo;	&#8217;
    ",": ",", // &sbquo;	&#8218;
    "—": "-", // &mdash;  &#8212;
    "…": "...", // &hellip; &#8230;
    "«": "<<",
    "»": ">>",
    "–": "-",
    " ": " ",
    " ": " ",
    " ": " ",
    "᾽": "'",
  };
  return textToClean.replace(
    /[“”’‘—,…«»–\u2007\u202F\u00A0]/g,
    (char) => specials[char as keyof typeof specials] || ""
  );
}

/**
 * Split a string into characters. This supports multi-byte characters outside of the [Basic Multilinugal Plane](https://en.wikipedia.org/wiki/Plane_(Unicode).
 * Using  `string.length` and `string[index]` does not work.
 * @param s string to be tokenized into characters
 * @returns array of characters
 */
export function splitIntoCharacters(s: string): string[] {
  const result: string[] = [];
  for (const t of s) {
    result.push(t);
  }

  return result;
}

/**
 * Replaces escaped control characters with their literal equivalents.
 * Converts \t to tab characters, \n to newlines (with a space prefix),
 * and handles double-escaped sequences (\\t, \\n) by converting them back to single escaped versions.
 * @param textToClear The input string containing escaped control characters.
 * @returns A new string with control characters properly converted.
 */
export function replaceControlCharacters(textToClear: string): string {
  textToClear = textToClear.replace(/(?<!\\)\\t/g, "\t");
  textToClear = textToClear.replace(/\\n/g, " \n");
  textToClear = textToClear.replace(/([^\\]|^)\\n/gm, "$1\n");
  textToClear = textToClear.replace(/\\\\t/gm, "\\t");
  textToClear = textToClear.replace(/\\\\n/gm, "\\n");

  return textToClear;
}

/**
 * Detect if a word contains RTL (Right-to-Left) characters.
 * This is for test scenarios where individual words may have different directions.
 * Uses a simple regex pattern that covers all common RTL scripts.
 * @param word the word to check for RTL characters
 * @returns true if the word contains RTL characters, false otherwise
 */
function hasRTLCharacters(word: string): boolean {
  if (!word || word.length === 0) {
    return false;
  }

  // This covers Arabic, Farsi, Urdu, and other RTL scripts
  const rtlPattern =
    /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

  return rtlPattern.test(word);
}

/**
 * Cache for word direction to avoid repeated calculations per word
 * Keyed by the stripped core of the word; can be manually cleared when needed
 */
let wordDirectionCache: Map<string, boolean> = new Map();

export function clearWordDirectionCache(): void {
  wordDirectionCache.clear();
}

export function isWordRightToLeft(
  word: string | undefined,
  languageRTL: boolean,
  reverseDirection?: boolean
): boolean {
  if (word === undefined || word.length === 0) {
    return reverseDirection ? !languageRTL : languageRTL;
  }

  // Strip leading/trailing punctuation and whitespace so attached opposite-direction
  // punctuation like "word؟" or "،word" doesn't flip the direction detection
  // and if only punctuation/symbols/whitespace, use main language direction
  const core = word.replace(/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu, "");
  if (core.length === 0) return reverseDirection ? !languageRTL : languageRTL;

  // cache by core to handle variants like "word" vs "word؟"
  const cached = wordDirectionCache.get(core);
  if (cached !== undefined) return reverseDirection ? !cached : cached;

  const result = hasRTLCharacters(core);
  wordDirectionCache.set(core, result);

  return reverseDirection ? !result : result;
}

export const CHAR_EQUIVALENCE_MAPS = [
  new Map(
    ["’", "‘", "'", "ʼ", "׳", "ʻ", "᾽", "᾽"].map((char, index) => [char, index])
  ),
  new Map([`"`, "”", "“", "„"].map((char, index) => [char, index])),
  new Map(["–", "—", "-", "‐"].map((char, index) => [char, index])),
  new Map([",", "‚"].map((char, index) => [char, index])),
];

/**
 * Checks if two characters are visually/typographically equivalent for typing purposes.
 * This allows users to type different variants of the same character and still be considered correct.
 * @param char1 The first character to compare
 * @param char2 The second character to compare
 * @returns true if the characters are equivalent, false otherwise
 */
export function areCharactersVisuallyEqual(
  char1: string,
  char2: string
): boolean {
  // If characters are exactly the same, they're equivalent
  if (char1 === char2) {
    return true;
  }

  // Check each equivalence map
  for (const map of CHAR_EQUIVALENCE_MAPS) {
    if (map.has(char1) && map.has(char2)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a character is a directly typable space character on a standard keyboard.
 * These are space characters that can be typed without special input methods or copy-pasting.
 * @param char The character to check.
 * @returns True if the character is a directly typable space, false otherwise.
 */
export function isSpace(char: string): boolean {
  if (char.length !== 1) return false;

  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) return false;

  // Directly typable spaces:
  // U+0020 - Regular space (spacebar)
  // U+2002 - En space (Option+Space on Mac)
  // U+2003 - Em space (Option+Shift+Space on Mac)
  // U+2009 - Thin space (various input methods)
  // U+3000 - Ideographic space (CJK input methods)
  return (
    codePoint === 0x0020 ||
    codePoint === 0x2002 ||
    codePoint === 0x2003 ||
    codePoint === 0x2009 ||
    codePoint === 0x3000
  );
}

export function replaceSpaceLikeCharacters(text: string): string {
  return text.replace(/[\u0020\u2002\u2003\u2009\u3000]/g, " ");
}

// Export testing utilities for unit tests
export const __testing = {
  hasRTLCharacters,
};
