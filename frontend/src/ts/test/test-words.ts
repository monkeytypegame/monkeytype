import * as TestState from "./test-state";
import type { Direction } from "../utils/strings";

export type CommitChar = " " | "\n" | "";

type Word = {
  text: string;
  textWithCommit: string;
  commit: CommitChar;
  display: string;
  direction: Direction;
  sectionIndex: number;
};

export type WordMinimal = Omit<Word, "textWithCommit" | "display">;

const commitCharsToDisplay: Set<CommitChar> = new Set(["\n"]);

class Words {
  private list: Word[];
  public length: number;
  public haveNumbers: boolean;
  public haveNewlines: boolean;
  public haveTabs: boolean;
  public koreanStatus: boolean;

  constructor() {
    this.list = [];
    this.haveNumbers = false;
    this.haveNewlines = false;
    this.haveTabs = false;
    this.koreanStatus = false;
    this.length = 0;
  }

  private createFullWord(minimalWord: WordMinimal): Word {
    return {
      ...minimalWord,
      textWithCommit: minimalWord.text + minimalWord.commit,
      display:
        minimalWord.text +
        (commitCharsToDisplay.has(minimalWord.commit)
          ? minimalWord.commit
          : ""),
    };
  }

  get(i?: undefined, raw?: boolean): Word[];
  get(i: number, raw?: boolean): Word | undefined;
  get(i?: number, raw = false): Word | Word[] | undefined {
    if (i === undefined) {
      return [...this.list];
    } else {
      const word = this.list[i];
      if (!word) {
        return undefined;
      }
      if (raw) {
        const text = word.text.replace(/[.?!":\-,]/g, "")?.toLowerCase();
        return this.createFullWord({ ...word, text });
      } else {
        return word;
      }
    }
  }

  getCurrent(): Word | undefined {
    return this.list[TestState.activeWordIndex];
  }

  push(word: WordMinimal): Word {
    const wordObj = this.createFullWord({ ...word });
    this.list.push(wordObj);
    this.length = this.list.length;

    return wordObj;
  }

  reset(): void {
    this.list = [];
    this.length = 0;
    this.haveNumbers = false;
    this.haveNewlines = false;
    this.haveTabs = false;
    this.koreanStatus = false;
  }

  removeCommitCharacterFromLastWord(): void {
    if (this.length === 0) return;
    const lastWord = this.list[this.length - 1];
    if (lastWord === undefined) return;
    if (lastWord.commit === " " || lastWord.commit === "\n") {
      lastWord.commit = "";
      lastWord.textWithCommit = lastWord.text;
      lastWord.display = lastWord.text;
    }
  }
}

export const words = new Words();
