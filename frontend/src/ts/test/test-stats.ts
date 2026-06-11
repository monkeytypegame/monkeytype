import Hangul from "hangul-js";
import { Config } from "../config/store";
import * as TestInput from "./test-input";
import * as TestWords from "./test-words";
import * as TestState from "./test-state";
import * as Numbers from "@monkeytype/util/numbers";
import * as CustomText from "./custom-text";
import { getLastResult } from "../states/test";
import { countChars as countCharsUtils, getLastChar } from "../utils/strings";
import { isFunboxActiveWithProperty } from "./funbox/list";

type CharCount = {
  correctWordChars: number;
  allCorrectChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
};

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
};

export let start: number, end: number;
export let start2: number, end2: number;
export let start3: number, end3: number;
export let lastSecondNotRound = false;

export function getStats(): unknown {
  const ret = {
    lastResult: getLastResult(),
    start,
    end,
    start3,
    end3,
    afkHistory: TestInput.afkHistory,
    errorHistory: TestInput.errorHistory,
    wpmHistory: TestInput.wpmHistory,
    rawHistory: TestInput.rawHistory,
    burstHistory: TestInput.burstHistory,
    keypressCountHistory: TestInput.keypressCountHistory,
    currentBurstStart: TestInput.currentBurstStart,
    lastSecondNotRound,
    missedWords: TestInput.missedWords,
    accuracy: TestInput.accuracy,
    keypressTimings: TestInput.keypressTimings,
    keyOverlap: TestInput.keyOverlap,
    wordsHistory: TestWords.words.list.slice(
      0,
      TestInput.input.getHistory().length,
    ),
    inputHistory: TestInput.input.getHistory(),
  };

  try {
    // @ts-expect-error ---
    ret.keypressTimings.spacing.average =
      TestInput.keypressTimings.spacing.array.reduce(
        (previous, current) => (current += previous),
      ) / TestInput.keypressTimings.spacing.array.length;

    // @ts-expect-error ---
    ret.keypressTimings.spacing.sd = Numbers.stdDev(
      TestInput.keypressTimings.spacing.array,
    );
  } catch (e) {
    //
  }
  try {
    // @ts-expect-error ---
    ret.keypressTimings.duration.average =
      TestInput.keypressTimings.duration.array.reduce(
        (previous, current) => (current += previous),
      ) / TestInput.keypressTimings.duration.array.length;

    // @ts-expect-error ---
    ret.keypressTimings.duration.sd = Numbers.stdDev(
      TestInput.keypressTimings.duration.array,
    );
  } catch (e) {
    //
  }

  return ret;
}

export function restart(): void {
  start = 0;
  end = 0;
  start2 = 0;
  end2 = 0;
  start3 = 0;
  end3 = 0;
  lastSecondNotRound = false;
}

export function calculateTestSeconds(now?: number): number {
  let duration = (end - start) / 1000;

  if (now !== undefined) {
    duration = (now - start) / 1000;
  }

  return duration;
}

export function calculateWpmAndRaw(
  withDecimalPoints?: true,
  final = false,
  testSecondsOverride?: number,
  charsOverride?: CharCount,
): {
  wpm: number;
  raw: number;
} {
  const testSeconds =
    testSecondsOverride ??
    calculateTestSeconds(TestState.isActive ? performance.now() : end);

  const chars = charsOverride ?? countChars(final);
  const wpm = Numbers.roundTo2(
    (chars.correctWordChars * (60 / testSeconds)) / 5,
  );
  const raw = Numbers.roundTo2(
    ((chars.allCorrectChars + chars.incorrectChars + chars.extraChars) *
      (60 / testSeconds)) /
      5,
  );
  return {
    wpm: withDecimalPoints ? wpm : Math.round(wpm),
    raw: withDecimalPoints ? raw : Math.round(raw),
  };
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

export function calculateAfkSeconds(testSeconds: number): number {
  let extraAfk = 0;
  if (testSeconds !== undefined) {
    extraAfk = Math.round(testSeconds) - TestInput.keypressCountHistory.length;
    if (extraAfk < 0) extraAfk = 0;
    // console.log("-- extra afk debug");
    // console.log("should be " + Math.ceil(testSeconds));
    // console.log(keypressPerSecond.length);
    // console.log(
    //   `gonna add extra ${extraAfk} seconds of afk because of no keypress data`
    // );
  }
  const ret = TestInput.afkHistory.filter((afk) => afk).length;
  return ret + extraAfk;
}

export function setLastSecondNotRound(): void {
  lastSecondNotRound = true;
}

export function calculateBurst(endTime: number = performance.now()): number {
  const containsKorean = TestState.koreanStatus;
  const timeToWrite = (endTime - TestInput.currentBurstStart) / 1000;
  if (timeToWrite <= 0) return 0;
  let wordLength: number;
  wordLength = !containsKorean
    ? TestInput.input.current.length
    : Hangul.disassemble(TestInput.input.current).length;
  if (wordLength === 0) {
    wordLength = !containsKorean
      ? (TestInput.input.getHistoryLast()?.length ?? 0)
      : (Hangul.disassemble(TestInput.input.getHistoryLast() as string)
          ?.length ?? 0);
  }
  if (wordLength === 0) return 0;
  const speed = Numbers.roundTo2((wordLength * (60 / timeToWrite)) / 5);
  return Math.round(speed);
}

export function calculateAccuracy(): number {
  const acc =
    (TestInput.accuracy.correct /
      (TestInput.accuracy.correct + TestInput.accuracy.incorrect)) *
    100;
  return isNaN(acc) ? 100 : acc;
}

export function removeAfkData(): void {
  const testSeconds = calculateTestSeconds();
  TestInput.keypressCountHistory.splice(testSeconds);
  TestInput.wpmHistory.splice(testSeconds);
  TestInput.rawHistory.splice(testSeconds);
}

function getInputWords(): string[] {
  const containsKorean = TestState.koreanStatus;

  let inputWords = [...TestInput.input.getHistory()];

  if (TestState.isActive) {
    inputWords.push(TestInput.input.current);
  }

  if (containsKorean) {
    inputWords = inputWords.map((w) => Hangul.disassemble(w).join(""));
  }

  for (let i = 0; i < inputWords.length - 1; i++) {
    if (
      getLastChar(inputWords[i] as string) !== "\n" &&
      !isFunboxActiveWithProperty("nospace")
    ) {
      inputWords[i] += " ";
    }
  }

  return inputWords;
}

function getTargetWords(): string[] {
  const containsKorean = TestState.koreanStatus;

  let targetWords = [
    ...(Config.mode === "zen"
      ? TestInput.input.getHistory()
      : TestWords.words.list),
  ];

  if (TestState.isActive) {
    targetWords.push(
      Config.mode === "zen"
        ? TestInput.input.current
        : TestWords.words.getCurrentText(),
    );
  }

  if (containsKorean) {
    targetWords = targetWords.map((w) => Hangul.disassemble(w).join(""));
  }

  for (let i = 0; i < targetWords.length - 1; i++) {
    if (
      getLastChar(targetWords[i] as string) !== "\n" &&
      !isFunboxActiveWithProperty("nospace")
    ) {
      targetWords[i] += " ";
    }
  }

  return targetWords;
}

function countChars(final = false): CharCount {
  let correctWordChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;

  const inputWords = getInputWords();
  const targetWords = getTargetWords();

  const isTimedTest =
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimit().mode === "time");

  for (let i = 0; i < inputWords.length; i++) {
    const inputWord = inputWords[i] as string;
    let targetWord = targetWords[i] as string;
    const isLastInputWord = i === inputWords.length - 1;

    // getTargetWords appends a delimiter to every word except the last in the
    // generated list; for the last input word (active in timed/mid-test, or
    // the actual last word) drop that delimiter so overshoot counts as extra
    if (isLastInputWord && targetWord.endsWith(" ")) {
      targetWord = targetWord.slice(0, -1);
    }

    const { correctWord, allCorrect, incorrect, missed, extra } =
      countCharsUtils(
        inputWord,
        targetWord,
        isLastInputWord && ((isTimedTest && final) || !final),
        // historical words advanced via commit space; last is in-flight
        !isLastInputWord,
      );

    correctWordChars += correctWord;
    correctChars += allCorrect;
    incorrectChars += incorrect;
    extraChars += extra;
    missedChars += missed;
  }

  return {
    correctWordChars: correctWordChars,
    allCorrectChars: correctChars,
    incorrectChars:
      Config.mode === "zen" ? TestInput.accuracy.incorrect : incorrectChars,
    extraChars: extraChars,
    missedChars: missedChars,
  };
}

export function calculateFinalStats(): Stats {
  console.debug("Calculating result stats");
  let testSeconds = calculateTestSeconds();
  console.debug(
    "Test seconds",
    testSeconds,
    " (date based) ",
    (end2 - start2) / 1000,
    " (performance.now based)",
    (end3 - start3) / 1000,
    " (new Date based)",
  );
  console.debug(
    "Test seconds",
    Numbers.roundTo1(testSeconds),
    " (date based) ",
    Numbers.roundTo1((end2 - start2) / 1000),
    " (performance.now based)",
    Numbers.roundTo1((end3 - start3) / 1000),
    " (new Date based)",
  );
  if (Config.mode !== "custom") {
    testSeconds = Numbers.roundTo2(testSeconds);
    console.debug(
      "Mode is not custom - rounding to 2. New time: ",
      testSeconds,
    );
  }

  const chars = countChars(true);
  const { wpm, raw } = calculateWpmAndRaw(true, true, testSeconds, chars);
  const acc = Numbers.roundTo2(calculateAccuracy());
  const ret = {
    wpm: isNaN(wpm) ? 0 : wpm,
    wpmRaw: isNaN(raw) ? 0 : raw,
    acc: acc,
    correctChars: chars.correctWordChars,
    incorrectChars: chars.incorrectChars,
    missedChars: chars.missedChars,
    extraChars: chars.extraChars,
    allChars: chars.allCorrectChars + chars.incorrectChars + chars.extraChars,
    time: Numbers.roundTo2(testSeconds),
  };
  console.debug("Result stats", ret);
  return ret;
}
