import * as TestState from "./test-state";

class Words {
  public list: string[];
  public sectionIndexList: number[];
  public length: number;
  // when true, words are not separated by a space (e.g. nospace funbox / CJK)
  private nospace: boolean;

  constructor() {
    this.list = [];
    this.sectionIndexList = [];
    this.length = 0;
    this.nospace = false;
  }

  setNospace(tf: boolean): void {
    this.nospace = tf;
  }

  getText(i?: undefined, raw?: boolean): string[];
  getText(i: number, raw?: boolean): string;
  getText(i?: number, raw = false): string | string[] | undefined {
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
  getCurrentText(): string {
    return this.list[TestState.activeWordIndex] ?? "";
  }
  getLast(): string {
    return this.list[this.list.length - 1] as string;
  }
  push(word: string, sectionIndex: number): void {
    // The word separator is stored as a trailing space on the preceding word.
    // A word stays bare until another word is appended after it, so the final
    // word never gets a separator. Newline-terminated words and nospace mode
    // use no space separator.
    const prevIndex = this.list.length - 1;
    const prev = this.list[prevIndex];
    if (prev !== undefined && !this.nospace && !prev.endsWith("\n")) {
      this.list[prevIndex] = `${prev} `;
    }
    this.list.push(word);
    this.sectionIndexList.push(sectionIndex);
    this.length = this.list.length;
  }

  reset(): void {
    this.list = [];
    this.sectionIndexList = [];
    this.length = this.list.length;
  }
  clean(): void {
    for (const s of this.list) {
      if (/ +/.test(s)) {
        const id = this.list.indexOf(s);
        const tempList = s.split(" ");
        this.list.splice(id, 1);
        for (let i = 0; i < tempList.length; i++) {
          this.list.splice(id + i, 0, tempList[i] as string);
        }
      }
    }
  }
}

export const words = new Words();
export let hasNumbers = false;

export function setHasNumbers(tf: boolean): void {
  hasNumbers = tf;
}
