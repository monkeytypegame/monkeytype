import { lastElementFromArray } from "../utils/arrays";
import { mean, roundTo2 } from "@monkeytype/util/numbers";
import * as TestState from "./test-state";
import Config from "../config";
import { getInputElementValue } from "../input/input-element";

const keysToTrack = new Set([
  "NumpadMultiply",
  "NumpadSubtract",
  "NumpadAdd",
  "NumpadDecimal",
  "NumpadEqual",
  "NumpadDivide",
  "Numpad0",
  "Numpad1",
  "Numpad2",
  "Numpad3",
  "Numpad4",
  "Numpad5",
  "Numpad6",
  "Numpad7",
  "Numpad8",
  "Numpad9",
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
  "IntlBackslash",
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
  "Enter",
  "Tab",
  "NoCode", //android (smells) and some keyboards might send no location data - need to use this as a fallback
]);

type KeypressTimings = {
  spacing: {
    first: number;
    last: number;
    array: number[];
  };
  duration: {
    array: number[];
  };
};

type Keydata = {
  timestamp: number;
  index: number;
};

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

let keyDownData: Record<string, Keydata> = {};

export const input = new Input();
export const corrected = new Corrected();

export let keypressCountHistory: number[] = [];
let currentKeypressCount = 0;
export let currentBurstStart = 0;
export let missedWords: Record<string, number> = {};
export let accuracy = {
  correct: 0,
  incorrect: 0,
};
export let keypressTimings: KeypressTimings = {
  spacing: {
    first: -1,
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
export let errorHistory: ErrorHistoryObject[] = [];
let currentErrorHistory: ErrorHistoryObject = {
  count: 0,
  words: [],
};

export let afkHistory: boolean[] = [];
let currentAfk = true;

export function incrementKeypressCount(): void {
  currentKeypressCount++;
}

export function setCurrentNotAfk(): void {
  currentAfk = false;
}

export function incrementKeypressErrors(): void {
  currentErrorHistory.count++;
}

export function pushKeypressWord(wordIndex: number): void {
  currentErrorHistory.words.push(wordIndex);
}

export function setBurstStart(time: number): void {
  currentBurstStart = time;
}

export function pushKeypressesToHistory(): void {
  keypressCountHistory.push(currentKeypressCount);
  currentKeypressCount = 0;
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

export function forceKeyup(now: number): void {
  //using mean here because for words mode, the last keypress ends the test.
  //if we then force keyup on that last keypress, it will record a duration of 0
  //skewing the average and standard deviation

  const indexesToRemove = new Set(
    Object.values(keyDownData).map((data) => data.index)
  );

  const keypressDurations = keypressTimings.duration.array.filter(
    (_, index) => !indexesToRemove.has(index)
  );
  if (keypressDurations.length === 0) {
    // this means the test ended while all keys were still held - probably safe to ignore
    // since this will result in a "too short" test anyway
    return;
  }

  const avg = roundTo2(mean(keypressDurations));

  const orderedKeys = Object.entries(keyDownData).sort(
    (a, b) => a[1].timestamp - b[1].timestamp
  );

  for (const [key, { index }] of orderedKeys) {
    keypressTimings.duration.array[index] = avg;

    if (key === "NoCode") {
      noCodeIndex--;
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete keyDownData[key];

    updateOverlap(now);
  }
}

function getEventCode(event: KeyboardEvent): string {
  if (event.code === "NumpadEnter" && Config.funbox.includes("58008")) {
    return "Space";
  }

  if (event.code.includes("Arrow") && Config.funbox.includes("arrows")) {
    return "NoCode";
  }

  if (
    event.code === "" ||
    event.code === undefined ||
    event.key === "Unidentified"
  ) {
    return "NoCode";
  }

  return event.code;
}

let noCodeIndex = 0;
export function recordKeyupTime(now: number, event: KeyboardEvent): void {
  if (event.repeat) {
    console.log(
      "Keyup not recorded - repeat",
      event.key,
      event.code,
      //ignore for logging
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.which
    );
    return;
  }

  let key = getEventCode(event);

  if (!keysToTrack.has(key)) return;

  if (key === "NoCode") {
    noCodeIndex--;
    key = "NoCode" + noCodeIndex;
  }

  const keyDownDataForKey = keyDownData[key];

  if (keyDownDataForKey === undefined) return;

  const diff = Math.abs(keyDownDataForKey.timestamp - now);
  keypressTimings.duration.array[keyDownDataForKey.index] = diff;

  console.debug("Keyup recorded", key, diff);
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete keyDownData[key];

  updateOverlap(now);
}

export function recordKeydownTime(now: number, event: KeyboardEvent): void {
  if (event.repeat) {
    console.log(
      "Keydown not recorded - repeat",
      event.key,
      event.code,
      //ignore for logging
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.which
    );
    return;
  }

  let key = getEventCode(event);

  if (!keysToTrack.has(key)) {
    console.debug("Keydown not recorded - not tracked", key);
    return;
  }

  if (keyDownData[key] !== undefined) {
    console.debug("Key already down", key);
    return;
  }

  if (key === "NoCode") {
    key = "NoCode" + noCodeIndex;
    noCodeIndex++;
  }

  keyDownData[key] = {
    timestamp: now,
    index: keypressTimings.duration.array.length,
  };
  keypressTimings.duration.array.push(0);

  updateOverlap(keyDownData[key]?.timestamp as number);

  if (keypressTimings.spacing.last !== -1) {
    const diff = Math.abs(now - keypressTimings.spacing.last);
    keypressTimings.spacing.array.push(roundTo2(diff));
    console.debug("Keydown recorded", key, diff);
  }
  keypressTimings.spacing.last = now;
  if (keypressTimings.spacing.first === -1) {
    keypressTimings.spacing.first = now;
    console.debug("First keydown recorded", key, now);
  }
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
  //because keydown triggers before input, we need to grab the first keypress data here and carry it over

  //take the key with the largest index
  const lastKey = Object.keys(keyDownData).reduce((a, b) => {
    const aIndex = keyDownData[a]?.index;
    const bIndex = keyDownData[b]?.index;
    if (aIndex === undefined) return b;
    if (bIndex === undefined) return a;
    return aIndex > bIndex ? a : b;
  }, "");

  //get the data
  const lastKeyData = keyDownData[lastKey];

  //reset
  keypressTimings = {
    spacing: {
      first: -1,
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
  noCodeIndex = 0;

  //carry over
  if (lastKeyData !== undefined) {
    keypressTimings = {
      spacing: {
        first: lastKeyData.timestamp,
        last: lastKeyData.timestamp,
        array: [],
      },
      duration: {
        array: [0],
      },
    };
    keyDownData[lastKey] = {
      timestamp: lastKeyData.timestamp,
      // make sure to set it to the first index
      index: 0,
    };
  }

  console.debug("Keypress timings reset");
}

export function pushMissedWord(word: string): void {
  if (!Object.keys(missedWords).includes(word)) {
    missedWords[word] = 1;
  } else {
    (missedWords[word] as number)++;
  }
}

export function pushToWpmHistory(wpm: number): void {
  wpmHistory.push(wpm);
}

export function pushToRawHistory(raw: number): void {
  rawHistory.push(raw);
}

export function pushBurstToHistory(speed: number): void {
  if (burstHistory[TestState.activeWordIndex] === undefined) {
    burstHistory.push(speed);
  } else {
    //repeated word - override
    burstHistory[TestState.activeWordIndex] = speed;
  }
}

export function restart(): void {
  wpmHistory = [];
  rawHistory = [];
  burstHistory = [];
  keypressCountHistory = [];
  currentKeypressCount = 0;
  afkHistory = [];
  currentAfk = true;
  errorHistory = [];
  currentErrorHistory = {
    count: 0,
    words: [],
  };
  currentBurstStart = 0;
  missedWords = {};
  accuracy = {
    correct: 0,
    incorrect: 0,
  };
}
