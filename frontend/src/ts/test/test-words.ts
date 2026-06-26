import * as TestState from "./test-state";

type CommitChar = " " | "\n" | "";

type Word = {
  text: string;
  textWithCommit: string;
  commit: CommitChar;
  display: string;
  sectionIndex: number;
};

const commitCharsToDisplay: CommitChar[] = ["\n"];

class Words {
  private list: Word[];
  public length: number;

  constructor() {
    this.list = [];
    this.length = 0;
  }

  get(i?: undefined, raw?: boolean): Word[];
  get(i: number, raw?: boolean): Word | undefined;
  get(i?: number, raw = false): Word | Word[] | undefined {
    if (i === undefined) {
      return this.list;
    } else {
      const word = this.list[i];
      if (!word) {
        return undefined;
      }
      if (raw) {
        const text = word.text.replace(/[.?!":\-,]/g, "")?.toLowerCase();
        return {
          text,
          textWithCommit: text + word.commit,
          display:
            text +
            (commitCharsToDisplay.includes(word.commit) ? word.commit : ""),
          commit: word.commit,
          sectionIndex: word.sectionIndex,
        };
      } else {
        return word;
      }
    }
  }
  getCurrent(): Word | undefined {
    return this.list[TestState.activeWordIndex];
  }
  push(word: string, sectionIndex: number): void {
    let commit: CommitChar = "";
    if (word.endsWith(" ")) {
      commit = " ";
      word = word.slice(0, -1);
    } else if (word.endsWith("\n")) {
      commit = "\n";
      word = word.slice(0, -1);
    }
    this.list.push({
      text: word,
      textWithCommit: word + commit,
      commit,
      display: word + (commitCharsToDisplay.includes(commit) ? commit : ""),
      sectionIndex,
    });
    this.length = this.list.length;
  }

  reset(): void {
    this.list = [];
    this.length = 0;
  }
}

export const words = new Words();
