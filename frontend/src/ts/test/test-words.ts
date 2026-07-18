import * as TestState from "./test-state";

type CommitChar = " " | "\n" | "";

type Word = {
  text: string;
  textWithCommit: string;
  commit: CommitChar;
  display: string;
  sectionIndex: number;
};

type WordMinimal = Omit<Word, "textWithCommit" | "display">;

const commitCharsToDisplay: Set<CommitChar> = new Set(["\n"]);

class Words {
  private list: Word[];
  public length: number;

  constructor() {
    this.list = [];
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

  changeText(newText: string, wordIndex?: number): Word | null {
    let word = this.list[wordIndex ?? TestState.activeWordIndex];
    if (word === undefined) return null;

    word = this.createFullWord({ ...word, text: newText });
    this.list[wordIndex ?? TestState.activeWordIndex] = word;
    return word;
  }

  push(word: string, sectionIndex: number): Word {
    let commit: CommitChar = "";
    if (word.endsWith(" ")) {
      commit = " ";
      word = word.slice(0, -1);
    } else if (word.endsWith("\n")) {
      commit = "\n";
      word = word.slice(0, -1);
    }

    const wordObj = this.createFullWord({ text: word, commit, sectionIndex });
    this.list.push(wordObj);
    this.length = this.list.length;

    return wordObj;
  }

  reset(): void {
    this.list = [];
    this.length = 0;
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
