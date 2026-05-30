import * as TestInput from "./test-input";
import * as TestWords from "./test-words";
import { getLastResult } from "../states/test";

export type Stats = {
  wpm: number;
  wpmRaw: number;
  acc: number;
  correctChars: number;
  incorrectChars: number;
  missedChars: number;
  extraChars: number;
  allChars: number;
  time: number;
  spaces: number;
  correctSpaces: number;
};

export let start: number, end: number;
export let start2: number, end2: number;
export let start3: number, end3: number;

export function getStats(): unknown {
  const ret = {
    lastResult: getLastResult(),
    start,
    end,
    start3,
    end3,
    missedWords: TestInput.missedWords,
    accuracy: TestInput.accuracy,
    keyOverlap: TestInput.keyOverlap,
    wordsHistory: TestWords.words.list.slice(
      0,
      TestInput.input.getHistory().length,
    ),
    inputHistory: TestInput.input.getHistory(),
  };

  return ret;
}

export function restart(): void {
  start = 0;
  end = 0;
  start2 = 0;
  end2 = 0;
  start3 = 0;
  end3 = 0;
}

export function calculateTestSeconds(now?: number): number {
  let duration = (end - start) / 1000;

  if (now !== undefined) {
    duration = (now - start) / 1000;
  }

  return duration;
}

export function setEnd(e: number): void {
  end = e;
  end2 = Date.now();
  end3 = new Date().getTime();
}

export function setStart(s: number): void {
  start = s;
  start2 = Date.now();
  start3 = new Date().getTime();
}
