import * as TestState from "./test-state";

class Words {
  public list: string[];
  public sectionIndexList: number[];
  public length: number;

  constructor() {
    this.list = [];
    this.sectionIndexList = [];
    this.length = 0;
  }

  getText(i?: undefined): string[];
  getText(i: number): string;
  getText(i?: number): string | string[] | undefined {
    if (i === undefined) {
      return this.list;
    }
    return this.list[i];
  }
  getCurrentText(): string {
    return this.list[TestState.activeWordIndex] ?? "";
  }
  push(word: string, sectionIndex: number): void {
    this.list.push(word);
    this.sectionIndexList.push(sectionIndex);
    this.length = this.list.length;
  }

  reset(): void {
    this.list = [];
    this.sectionIndexList = [];
    this.length = this.list.length;
  }

  removeCommitCharacterFromLastWord(): void {
    if (this.length === 0) return;
    const lastWord = this.list[this.length - 1];
    if (lastWord === undefined) return;
    if (lastWord.endsWith(" ") || lastWord.endsWith("\n")) {
      this.list[this.length - 1] = lastWord.slice(0, -1);
    }
  }
}

export const words = new Words();
export let hasNumbers = false;

export function setHasNumbers(tf: boolean): void {
  hasNumbers = tf;
}
