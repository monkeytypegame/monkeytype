import * as FunboxList from "./funbox/funbox-list";
import { dreymarIndex, randomElementFromArray } from "../utils/misc";
import Config from "../config";

let currentWordset: Wordset | null = null;

export class Wordset {
  public words: string[];
  public length: number;
  constructor(words: string[]) {
    this.words = words;
    this.length = this.words.length;
  }

  public randomWord(mode: MonkeyTypes.FunboxWordsFrequency): string {
    if (mode === "zipf") {
      return this.words[dreymarIndex(this.words.length)];
    } else {
      return randomElementFromArray(this.words);
    }
  }
}

export async function withWords(words: string[]): Promise<Wordset> {
  const wordFunbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.withWords
  );
  if (wordFunbox?.functions?.withWords) {
    return wordFunbox.functions.withWords(words);
  }
  if (currentWordset == null || words !== currentWordset.words) {
    currentWordset = new Wordset(words);
  }
  return currentWordset;
}
