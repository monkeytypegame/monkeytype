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
 * Cache for word direction to avoid repeated calculations per word
 * clear the cache when language settings change
 */
let wordDirectionCache: Map<string, boolean> = new Map();
let lastLanguageRTL: boolean | null = null;

export function clearWordDirectionCache(): void {
  wordDirectionCache.clear();
  lastLanguageRTL = null;
}

/**
 * Detect if a word contains RTL (Right-to-Left) characters.
 * This is for mixed language scenarios where individual words may have different directions.
 * Uses a simple regex pattern for efficiency and reliability.
 * @param word the word to check for RTL characters
 * @returns true if the word contains RTL characters, false otherwise
 *
 * @example
 * hasRTLCharacters("hello") // false
 * hasRTLCharacters("مرحبا") // true (Arabic)
 * hasRTLCharacters("שלום") // true (Hebrew)
 * hasRTLCharacters("helloمرحبا") // true (mixed)
 * hasRTLCharacters("123") // false
 * hasRTLCharacters("") // false
 */
export function hasRTLCharacters(word: string): boolean {
  if (!word || word.length === 0) {
    return false;
  }

  // Simple regex pattern for common RTL scripts
  // This covers Arabic, Farsi, Urdu, and other RTL scripts
  const rtlPattern =
    /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

  return rtlPattern.test(word);
}

export function getWordDirection(
  word: string | undefined,
  languageRTL: boolean
): boolean {
  if (word === undefined || word.length === 0) return languageRTL;
  // clear cache if language direction changed
  if (lastLanguageRTL !== languageRTL) {
    clearWordDirectionCache();
    lastLanguageRTL = languageRTL;
  }

  // Strip leading/trailing punctuation and whitespace so attached opposite-direction
  // punctuation like "word؟" or "،word" doesn't flip the direction detection
  // and if only punctuation/symbols/whitespace, use main language direction
  const core = word.replace(/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu, "");
  if (core.length === 0) return languageRTL;

  // with the stripped core to avoid duplicating entries for variants like "word" vs "word؟"
  const cacheKey = `${core}:${languageRTL}`;
  const cached = wordDirectionCache.get(cacheKey);
  if (cached !== undefined) return cached;

  // cache based on the core letters only
  const result = hasRTLCharacters(core);
  wordDirectionCache.set(cacheKey, result);

  return result;
}
