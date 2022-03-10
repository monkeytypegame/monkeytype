import * as TestWords from "./test-words";
import { roundTo2 } from "./../misc";

type Keypress = {
  count: number;
  errors: number;
  words: number[];
  afk: boolean;
};

type KeypressTimings = {
  spacing: {
    current: number;
    array: number[] | "toolong";
  };
  duration: {
    current: number;
    array: number[] | "toolong";
  };
};

class Input {
  current: string;
  history: string[];
  historyLength: number;
  length: number;
  constructor() {
    this.current = "";
    this.history = [];
    this.historyLength = 0;
    this.length = 0;
  }

  reset(): void {
    this.current = "";
    this.history = [];
    this.length = 0;
  }

  resetHistory(): void {
    this.history = [];
    this.length = 0;
  }

  setCurrent(val: string): void {
    this.current = val;
    this.length = this.current.length;
  }

  appendCurrent(val: string): void {
    this.current += val;
    this.length = this.current.length;
  }

  resetCurrent(): void {
    this.current = "";
  }

  getCurrent(): string {
    return this.current;
  }

  pushHistory(): void {
    this.history.push(this.current);
    this.historyLength = this.history.length;
    this.resetCurrent();
  }

  popHistory(): string {
    const ret = this.history.pop() ?? "";
    this.historyLength = this.history.length;
    return ret;
  }

  getHistory(i?: number): string | string[] {
    if (i === undefined) {
      return this.history;
    } else {
      return this.history[i];
    }
  }

  getHistoryLast(): string {
    return this.history[this.history.length - 1];
  }
}

class Corrected {
  current: string;
  history: string[];
  constructor() {
    this.current = "";
    this.history = [];
  }
  setCurrent(val: string): void {
    this.current = val;
  }

  appendCurrent(val: string): void {
    this.current += val;
  }

  resetCurrent(): void {
    this.current = "";
  }

  resetHistory(): void {
    this.history = [];
  }

  reset(): void {
    this.resetCurrent();
    this.resetHistory();
  }

  getHistory(i: number): string {
    return this.history[i];
  }

  popHistory(): string {
    return this.history.pop() ?? "";
  }

  pushHistory(): void {
    this.history.push(this.current);
    this.current = "";
  }
}

export const input = new Input();
export const corrected = new Corrected();

export let keypressPerSecond: Keypress[] = [];
export let currentKeypress: Keypress = {
  count: 0,
  errors: 0,
  words: [],
  afk: true,
};
export let lastKeypress: number;
export let currentBurstStart = 0;
export let missedWords: {
  [word: string]: number;
} = {};
export let accuracy = {
  correct: 0,
  incorrect: 0,
};
export let keypressTimings: KeypressTimings = {
  spacing: {
    current: -1,
    array: [],
  },
  duration: {
    current: -1,
    array: [],
  },
};
export let wpmHistory: number[] = [];
export let rawHistory: number[] = [];
export let burstHistory: number[] = [];
export let bailout = false;
export function setBailout(tf: boolean): void {
  bailout = tf;
}

export let spacingDebug = false;
export function enableSpacingDebug(): void {
  spacingDebug = true;
  console.clear();
}

export function updateLastKeypress(): void {
  lastKeypress = performance.now();
}

export function incrementKeypressCount(): void {
  currentKeypress.count++;
}

export function setKeypressNotAfk(): void {
  currentKeypress.afk = false;
}

export function incrementKeypressErrors(): void {
  currentKeypress.errors++;
}

export function pushKeypressWord(wordIndex: number): void {
  currentKeypress.words.push(wordIndex);
}

export function setBurstStart(time: number): void {
  currentBurstStart = time;
}

export function pushKeypressesToHistory(): void {
  keypressPerSecond.push(currentKeypress);
  currentKeypress = {
    count: 0,
    errors: 0,
    words: [],
    afk: true,
  };
}

export function incrementAccuracy(correctincorrect: boolean): void {
  if (correctincorrect) {
    accuracy.correct++;
  } else {
    accuracy.incorrect++;
  }
}

export function setKeypressTimingsTooLong(): void {
  keypressTimings.spacing.array = "toolong";
  keypressTimings.duration.array = "toolong";
}

export function pushKeypressDuration(val: number): void {
  (keypressTimings.duration.array as number[]).push(roundTo2(val));
}

export function setKeypressDuration(val: number): void {
  keypressTimings.duration.current = roundTo2(val);
}

function pushKeypressSpacing(val: number): void {
  (keypressTimings.spacing.array as number[]).push(roundTo2(val));
}

function setKeypressSpacing(val: number): void {
  keypressTimings.spacing.current = roundTo2(val);
}

export function recordKeypressSpacing(): void {
  const now = performance.now();
  const diff = Math.abs(keypressTimings.spacing.current - now);
  if (keypressTimings.spacing.current !== -1) {
    pushKeypressSpacing(diff);
    if (spacingDebug) {
      console.log(
        "spacing debug",
        "push",
        diff,
        "length",
        keypressTimings.spacing.array.length
      );
    }
  }
  setKeypressSpacing(now);
  if (spacingDebug) {
    console.log(
      "spacing debug",
      "set",
      now,
      "length",
      keypressTimings.spacing.array.length
    );
  }
  if (spacingDebug) {
    console.log(
      "spacing debug",
      "recorded",
      "length",
      keypressTimings.spacing.array.length
    );
  }
}

export function resetKeypressTimings(): void {
  keypressTimings = {
    spacing: {
      current: performance.now(),
      array: [],
    },
    duration: {
      current: performance.now(),
      array: [],
    },
  };
  if (spacingDebug) console.clear();
}

export function pushMissedWord(word: string): void {
  if (!Object.keys(missedWords).includes(word)) {
    missedWords[word] = 1;
  } else {
    missedWords[word]++;
  }
}

export function pushToWpmHistory(wpm: number): void {
  wpmHistory.push(wpm);
}

export function pushToRawHistory(raw: number): void {
  rawHistory.push(raw);
}

export function pushBurstToHistory(speed: number): void {
  if (burstHistory[TestWords.words.currentIndex] === undefined) {
    burstHistory.push(speed);
  } else {
    //repeated word - override
    burstHistory[TestWords.words.currentIndex] = speed;
  }
}

export function restart(): void {
  wpmHistory = [];
  rawHistory = [];
  burstHistory = [];
  keypressPerSecond = [];
  currentKeypress = {
    count: 0,
    errors: 0,
    words: [],
    afk: true,
  };
  currentBurstStart = 0;
  missedWords = {};
  accuracy = {
    correct: 0,
    incorrect: 0,
  };
  keypressTimings = {
    spacing: {
      current: -1,
      array: [],
    },
    duration: {
      current: -1,
      array: [],
    },
  };
}
