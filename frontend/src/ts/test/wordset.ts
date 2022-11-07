import { ActiveFunboxes } from "./funbox";
import { Wordset } from "../utils/misc";

let currentWordset: Wordset | null = null;

export async function withWords(words: string[]): Promise<Wordset> {
  const wordFunbox = ActiveFunboxes().find((f) => f.functions?.withWords);
  if (wordFunbox?.functions?.withWords) {
    return wordFunbox.functions.withWords(words);
  }
  if (currentWordset == null || words !== currentWordset.words) {
    currentWordset = new Wordset(words);
  }
  return currentWordset;
}
