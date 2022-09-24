import { Funboxes } from "./funbox";
import { Wordset } from "../utils/misc";

let currentWordset: Wordset | null = null;

export function withWords(words: string[], funbox: string): Wordset {
  for (const f of Funboxes) {
    if (funbox.split("#").includes(f.name) && f.withWords) {
      return f.withWords(words);
    }
  }

  if (currentWordset == null || words !== currentWordset.words) {
    currentWordset = new Wordset(words);
  }
  return currentWordset;
}
