import { ActiveFunboxes } from "../config";
import { Wordset } from "../utils/misc";

let currentWordset: Wordset | null = null;

export function withWords(words: string[]): Wordset {
  const wordFunbox = ActiveFunboxes().find((f) => f.withWords);
  if (wordFunbox?.withWords) return wordFunbox.withWords(words);

  if (currentWordset == null || words !== currentWordset.words) {
    currentWordset = new Wordset(words);
  }
  return currentWordset;
}
