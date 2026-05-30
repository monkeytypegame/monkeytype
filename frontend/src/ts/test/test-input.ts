import { lastElementFromArray } from "../utils/arrays";
import { getInputElementValue } from "../input/input-element";

type ErrorHistoryObject = {
  count: number;
  words: number[];
};

class Input {
  current: string;
  private history: string[];
  koreanStatus: boolean;
  constructor() {
    this.current = "";
    this.history = [];
    this.koreanStatus = false;
  }

  reset(): void {
    this.current = "";
    this.history = [];
  }

  resetHistory(): void {
    this.history = [];
  }

  setKoreanStatus(val: boolean): void {
    this.koreanStatus = val;
  }

  getKoreanStatus(): boolean {
    return this.koreanStatus;
  }

  pushHistory(): void {
    this.history.push(this.current);
    this.current = "";
  }

  popHistory(): string {
    const ret = this.history.pop() ?? "";
    return ret;
  }

  get(index: number): string | undefined {
    return this.history[index];
  }

  getHistory(): string[];
  getHistory(i: number): string | undefined;
  getHistory(i?: number): unknown {
    if (i === undefined) {
      return this.history;
    } else {
      return this.history[i];
    }
  }

  getHistoryLast(): string | undefined {
    return lastElementFromArray(this.history);
  }

  syncWithInputElement(): void {
    this.current = getInputElementValue().inputValue;
  }
}

class Corrected {
  current: string;
  private history: string[];
  constructor() {
    this.current = "";
    this.history = [];
  }

  reset(): void {
    this.history = [];
    this.current = "";
  }

  update(char: string, correct: boolean): void {
    if (this.current === "") {
      this.current += input.current;
    } else {
      const currCorrectedTestInputLength = this.current.length;

      const charIndex = input.current.length - 1;

      if (charIndex >= currCorrectedTestInputLength) {
        this.current += char;
      } else if (!correct) {
        this.current =
          this.current.substring(0, charIndex) +
          char +
          this.current.substring(charIndex + 1);
      }
    }
  }

  getHistory(i: number): string | undefined {
    return this.history[i];
  }

  popHistory(): string {
    const popped = this.history.pop() ?? "";
    this.current = popped;
    return popped;
  }

  pushHistory(): void {
    this.history.push(this.current);
    this.current = "";
  }
}

export const input = new Input();
export const corrected = new Corrected();

type MissedWordsType = Record<string, number>;
// We're using Object.create(null) to make sure that __proto__ won't have any special meaning when it's used to index the missedWords object (so if a user mistypes the word __proto__ it will appear in the practise words test)
export let missedWords: MissedWordsType = Object.create(
  null,
) as MissedWordsType;
export let accuracy = {
  correct: 0,
  incorrect: 0,
};

export let keyOverlap = {
  total: 0,
  lastStartTime: -1,
};

export let errorHistory: ErrorHistoryObject[] = [];
let currentErrorHistory: ErrorHistoryObject = {
  count: 0,
  words: [],
};

export let afkHistory: boolean[] = [];
let currentAfk = true;

export function setCurrentNotAfk(): void {
  currentAfk = false;
}

export function incrementKeypressErrors(): void {
  currentErrorHistory.count++;
}

export function pushKeypressWord(wordIndex: number): void {
  currentErrorHistory.words.push(wordIndex);
}

export function pushAfkToHistory(): void {
  afkHistory.push(currentAfk);
  currentAfk = true;
}

export function pushErrorToHistory(): void {
  errorHistory.push(currentErrorHistory);
  currentErrorHistory = {
    count: 0,
    words: [],
  };
}

export function incrementAccuracy(correctincorrect: boolean): void {
  if (correctincorrect) {
    accuracy.correct++;
  } else {
    accuracy.incorrect++;
  }
}

export function pushMissedWord(word: string): void {
  if (!Object.keys(missedWords).includes(word)) {
    missedWords[word] = 1;
  } else {
    (missedWords[word] as number) += 1;
  }
}

export function restart(): void {
  afkHistory = [];
  currentAfk = true;
  errorHistory = [];
  currentErrorHistory = {
    count: 0,
    words: [],
  };
  missedWords = Object.create(null) as MissedWordsType;
  accuracy = {
    correct: 0,
    incorrect: 0,
  };
}
