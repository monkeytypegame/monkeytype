import * as TestWords from "./test-words";
import { mean, roundTo2 } from "../utils/misc";

const keysToTrack = [
  "Backquote",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0",
  "Minus",
  "Equal",
  "KeyQ",
  "KeyW",
  "KeyE",
  "KeyR",
  "KeyT",
  "KeyY",
  "KeyU",
  "KeyI",
  "KeyO",
  "KeyP",
  "BracketLeft",
  "BracketRight",
  "Backslash",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyF",
  "KeyG",
  "KeyH",
  "KeyJ",
  "KeyK",
  "KeyL",
  "Semicolon",
  "Quote",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyB",
  "KeyN",
  "KeyM",
  "Comma",
  "Period",
  "Slash",
  "Space",
];

interface Keypress {
  count: number;
  errors: number;
  words: number[];
  afk: boolean;
}

interface KeypressTimings {
  spacing: {
    last: number;
    array: number[];
  };
  duration: {
    array: number[];
  };
}

interface Keydata {
  timestamp: number;
  index: number;
}

class Input {
  current: string;
  history: string[];
  historyLength: number;
  koreanStatus: boolean;
  length: number;
  constructor() {
    this.current = "";
    this.history = [];
    this.historyLength = 0;
    this.length = 0;
    this.koreanStatus = false;
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

  setKoreanStatus(val: boolean): void {
    this.koreanStatus = val;
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

  getKoreanStatus(): boolean {
    return this.koreanStatus;
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

  getHistoryLast(): string | undefined {
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

let keyDownData: Record<string, Keydata> = {};

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
    last: -1,
    array: [],
  },
  duration: {
    array: [],
  },
};
export let keyOverlap = {
  total: 0,
  lastStartTime: -1,
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

export function forceKeyup(): void {
  //using mean here because for words mode, the last keypress ends the test.
  //if we then force keyup on that last keypress, it will record a duration of 0
  //skewing the average and standard deviation
  const avg = roundTo2(mean(keypressTimings.duration.array));
  const keysOrder = Object.entries(keyDownData);
  keysOrder.sort((a, b) => a[1].timestamp - b[1].timestamp);
  for (let i = 0; i < keysOrder.length - 1; i++) {
    recordKeyupTime(keysOrder[i][0]);
  }
  const last = keysOrder[keysOrder.length - 1];
  if (last !== undefined) {
    keypressTimings.duration.array[keyDownData[last[0]].index] = avg;
  }
}

export function recordKeyupTime(key: string): void {
  if (keyDownData[key] === undefined || !keysToTrack.includes(key)) {
    return;
  }
  const now = performance.now();
  const diff = Math.abs(keyDownData[key].timestamp - now);
  keypressTimings.duration.array[keyDownData[key].index] = diff;
  delete keyDownData[key];

  updateOverlap(now);
}

export function recordKeydownTime(key: string): void {
  if (keyDownData[key] !== undefined || !keysToTrack.includes(key)) {
    return;
  }
  keyDownData[key] = {
    timestamp: performance.now(),
    index: keypressTimings.duration.array.length,
  };
  keypressTimings.duration.array.push(0);

  updateOverlap(keyDownData[key].timestamp);

  if (keypressTimings.spacing.last !== -1) {
    const diff = Math.abs(performance.now() - keypressTimings.spacing.last);
    keypressTimings.spacing.array.push(roundTo2(diff));
    if (spacingDebug) {
      console.log(
        "spacing debug",
        "recorded",
        "key",
        "length",
        keypressTimings.spacing.array.length,
        "val",
        roundTo2(diff)
      );
    }
  }
  keypressTimings.spacing.last = performance.now();
}

function updateOverlap(now: number): void {
  const keys = Object.keys(keyDownData);
  if (keys.length > 1) {
    if (keyOverlap.lastStartTime === -1) {
      keyOverlap.lastStartTime = now;
    }
  } else {
    if (keyOverlap.lastStartTime !== -1) {
      keyOverlap.total += now - keyOverlap.lastStartTime;
      keyOverlap.lastStartTime = -1;
    }
  }
}

export function resetKeypressTimings(): void {
  keypressTimings = {
    spacing: {
      last: -1,
      array: [],
    },
    duration: {
      array: [],
    },
  };
  keyOverlap = {
    total: 0,
    lastStartTime: -1,
  };
  keyDownData = {};
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
      last: -1,
      array: [],
    },
    duration: {
      array: [],
    },
  };
}
