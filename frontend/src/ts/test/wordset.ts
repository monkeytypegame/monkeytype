import { zipfyRandomArrayIndex } from "../utils/misc";
import { randomElementFromArray, shuffle } from "../utils/arrays";
import { Language } from "@monkeytype/schemas/languages";

export type FunboxWordsFrequency = "normal" | "zipf";

export type WordsetPick = { word: string; language?: Language };

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

  randomWord(mode: FunboxWordsFrequency): WordsetPick {
    if (mode === "zipf") {
      return {
        word: this.words[zipfyRandomArrayIndex(this.length)] as string,
      };
    } else {
      return { word: randomElementFromArray(this.words) };
    }
  }

  shuffledWord(): WordsetPick {
    if (this.shuffledIndexes.length === 0) {
      this.generateShuffledIndexes();
    }
    return {
      word: this.words[this.shuffledIndexes.pop() as number] as string,
    };
  }

  generateShuffledIndexes(): void {
    this.shuffledIndexes = [];
    for (let i = 0; i < this.length; i++) {
      this.shuffledIndexes.push(i);
    }
    shuffle(this.shuffledIndexes);
  }

  nextWord(): WordsetPick {
    if (this.orderedIndex >= this.length) {
      this.orderedIndex = 0;
    }
    return { word: this.words[this.orderedIndex++] as string };
  }
}

export async function withWords(words: string[]): Promise<Wordset> {
  if (currentWordset === null || words !== currentWordset.words) {
    currentWordset = new Wordset(words);
  }
  currentWordset.resetIndexes();
  return currentWordset;
}
