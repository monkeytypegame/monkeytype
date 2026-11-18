import {
  getActiveWordIndex,
  isDirectionReversed,
  isLanguageRightToLeft,
} from "../states/test";
import {
  type Direction,
  getWordDirection,
  reverseDirection,
} from "../utils/strings";

type CommitChar = " " | "\n" | "";

type Word = {
  text: string;
  textWithCommit: string;
  commit: CommitChar;
  display: string;
  /** resolved: language fallback and reversal are already applied */
  direction: Direction;
  sectionIndex: number;
};

const commitCharsToDisplay: Set<CommitChar> = new Set(["\n"]);

/** Needs the language direction and reversal of this test to be set. */
function resolveDirection(word: string): Direction {
  const direction = getWordDirection(
    word,
    isLanguageRightToLeft() ? "rtl" : "ltr",
  );
  return isDirectionReversed() ? reverseDirection(direction) : direction;
}

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
      return [...this.list];
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
          commit: word.commit,
          display:
            text + (commitCharsToDisplay.has(word.commit) ? word.commit : ""),
          direction: word.direction,
          sectionIndex: word.sectionIndex,
        };
      } else {
        return word;
      }
    }
  }
  getCurrent(): Word | undefined {
    return this.list[getActiveWordIndex()];
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
    const wordObj = {
      text: word,
      textWithCommit: word + commit,
      commit,
      display: word + (commitCharsToDisplay.has(commit) ? commit : ""),
      direction: resolveDirection(word),
      sectionIndex,
    };
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
    if (lastWord === undefined || lastWord.text === "") return;
    if (lastWord.commit === " " || lastWord.commit === "\n") {
      lastWord.commit = "";
      lastWord.textWithCommit = lastWord.text;
      lastWord.display = lastWord.text;
    }
  }
}

export const words = new Words();
