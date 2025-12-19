import { zipfyRandomArrayIndex } from "../utils/misc";
import { randomElementFromArray, shuffle } from "../utils/arrays";

export type FunboxWordsFrequency = "normal" | "zipf";

let currentWordset: Wordset | null = null;

export class Wordset {
  words: string[];
  length: number;
  orderedIndex: number;
  shuffledIndexes: number[];

  constructor(words: string[]) {
    this.words = words;
    this.length = this.words.length;
    this.shuffledIndexes = [];
    this.orderedIndex = 0;
  }

  resetIndexes(): void {
    this.orderedIndex = 0;
    this.shuffledIndexes = [];
  }

  randomWord(mode: FunboxWordsFrequency): string {
    if (mode === "zipf") {
      return this.words[zipfyRandomArrayIndex(this.words.length)] as string;
    } else {
      return randomElementFromArray(this.words);
    }
  }

  shuffledWord(): string {
    if (this.shuffledIndexes.length === 0) {
      this.generateShuffledIndexes();
    }
    return this.words[this.shuffledIndexes.pop() as number] as string;
  }

  generateShuffledIndexes(): void {
    this.shuffledIndexes = [];
    for (let i = 0; i < this.length; i++) {
      this.shuffledIndexes.push(i);
    }
    shuffle(this.shuffledIndexes);
  }

  nextWord(): string {
    if (this.orderedIndex >= this.length) {
      this.orderedIndex = 0;
    }
    return this.words[this.orderedIndex++] as string;
  }
}

export async function withWords(words: string[]): Promise<Wordset> {
  if (currentWordset === null || words !== currentWordset.words) {
    currentWordset = new Wordset(words);
  }
  currentWordset.resetIndexes();
  return currentWordset;
}
