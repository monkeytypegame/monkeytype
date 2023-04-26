import Config from "../config";
import * as FunboxList from "./funbox/funbox-list";
import * as CustomText from "./custom-text";

class Words {
  public list: string[];
  public length: number;
  public currentIndex: number;
  constructor() {
    this.list = [];
    this.length = 0;
    this.currentIndex = 0;
  }
  get(i?: undefined, raw?: boolean): string[];
  get(i: number, raw?: boolean): string;
  get(i?: number | undefined, raw = false): string | string[] {
    if (i === undefined) {
      return this.list;
    } else {
      if (raw) {
        return this.list[i]?.replace(/[.?!":\-,]/g, "")?.toLowerCase();
      } else {
        return this.list[i];
      }
    }
  }
  getCurrent(): string {
    return this.list[this.currentIndex];
  }
  getLast(): string {
    return this.list[this.list.length - 1];
  }
  push(word: string): void {
    this.list.push(word);
    this.length = this.list.length;
  }
  reset(): void {
    this.list = [];
    this.currentIndex = 0;
    this.length = this.list.length;
  }
  resetCurrentIndex(): void {
    this.currentIndex = 0;
  }
  decreaseCurrentIndex(): void {
    this.currentIndex--;
  }
  increaseCurrentIndex(): void {
    this.currentIndex++;
  }
  clean(): void {
    for (const s of this.list) {
      if (/ +/.test(s)) {
        const id = this.list.indexOf(s);
        const tempList = s.split(" ");
        this.list.splice(id, 1);
        for (let i = 0; i < tempList.length; i++) {
          this.list.splice(id + i, 0, tempList[i]);
        }
      }
    }
  }
}

export const words = new Words();
export let hasTab = false;
export let randomQuote = null as unknown as MonkeyTypes.Quote;

export function setRandomQuote(rq: MonkeyTypes.Quote): void {
  randomQuote = rq;
}

export function setHasTab(tf: boolean): void {
  hasTab = tf;
}

export function getWordsLimit(): number {
  let limit = 100;

  const funboxToPush = FunboxList.get(Config.funbox)
    .find((f) => f.properties?.find((fp) => fp.startsWith("toPush")))
    ?.properties?.find((fp) => fp.startsWith("toPush:"));

  if (Config.showAllLines) {
    if (Config.mode === "custom") {
      if (CustomText.isWordRandom) {
        limit = CustomText.word;
      } else if (!CustomText.isTimeRandom && !CustomText.isWordRandom) {
        limit = CustomText.text.length;
      }
    }
    if (Config.mode == "words") {
      limit = Config.words;
    }
  }

  //infinite words
  if (Config.mode === "words" && Config.words === 0) {
    limit = 100;
  }
  if (
    Config.mode === "custom" &&
    CustomText.isWordRandom &&
    CustomText.word === 0
  ) {
    limit = 100;
  }

  //funboxes
  if (funboxToPush) {
    limit = +funboxToPush.split(":")[1];
  }

  //make sure the limit is not higher than the word count
  if (Config.mode === "words" && Config.words !== 0 && Config.words < limit) {
    limit = Config.words;
  }
  if (
    Config.mode === "custom" &&
    !CustomText.isTimeRandom &&
    CustomText.isWordRandom &&
    CustomText.word !== 0 &&
    CustomText.word < limit
  ) {
    limit = CustomText.word;
  }
  if (
    Config.mode === "custom" &&
    !CustomText.isTimeRandom &&
    !CustomText.isWordRandom &&
    CustomText.text.length !== 0 &&
    CustomText.text.length < limit
  ) {
    limit = CustomText.text.length;
  }

  return limit;
}
