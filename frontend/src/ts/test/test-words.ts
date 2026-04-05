import { QuoteWithTextSplit } from "../controllers/quotes-controller";
import * as TestState from "./test-state";
import type { Direction } from "../utils/strings";

export type Word = {
  text: string;
  direction: Direction;
  sectionIndex: number;
};

class Words {
  public list: Word[];
  public length: number;
  public haveNumbers: boolean;
  public haveNewlines: boolean;
  public haveTabs: boolean;
  public koreanStatus: boolean;

  constructor() {
    this.list = [];
    this.length = 0;
    this.haveNumbers = false;
    this.haveNewlines = false;
    this.haveTabs = false;
    this.koreanStatus = false;
  }

  get(i?: undefined): Word[];
  get(i: number): Word | undefined;
  get(i?: number): Word[] | Word | undefined {
    if (i === undefined) return this.list;
    else return this.list[i];
  }

  getText(i?: undefined): string[];
  getText(i: number): string;
  getText(i?: number): string[] | string {
    if (i === undefined) return this.list.map((w) => w.text);
    else return this.list[i]?.text ?? "";
  }

  getCurrent(): Word | undefined {
    return this.list[TestState.activeWordIndex];
  }
  getCurrentText(): string {
    return this.list[TestState.activeWordIndex]?.text ?? "";
  }

  getLast(): Word | undefined {
    return this.list[this.length - 1];
  }

  push(words: Word[] | Word): void {
    if (Array.isArray(words)) {
      this.list.push(...words);
      this.length += words.length;
    } else {
      this.list.push(words);
      this.length++;
    }
  }

  reset(): void {
    this.list = [];
    this.length = 0;
    this.haveNumbers = false;
    this.haveNewlines = false;
    this.haveTabs = false;
    this.koreanStatus = false;
  }

  clean(): void {
    for (let i = 0; i < this.length; i++) {
      const word = this.get(i);
      if (!word) continue;
      if (/ +/.test(word.text)) {
        const tempList = word.text
          .split(" ")
          .map((text) => ({ ...word, text }));
        this.list.splice(i, 1, ...tempList);
        this.length += tempList.length - 1;
      }
    }
  }
}

export const words = new Words();

export let currentQuote = null as QuoteWithTextSplit | null;

export function setCurrentQuote(rq: QuoteWithTextSplit | null): void {
  currentQuote = rq;
}
