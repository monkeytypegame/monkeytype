import Hangul from "hangul-js";
import Config from "../config";
import * as Strings from "../utils/strings";
import * as TestInput from "./test-input";
import * as TestWords from "./test-words";
import * as FunboxList from "./funbox/funbox-list";
import * as TestState from "./test-state";
import * as Numbers from "../utils/numbers";
import {
  CompletedEvent,
  IncompleteTest,
} from "@monkeytype/contracts/schemas/results";

type CharCount = {
  spaces: number;
  correctWordChars: number;
  allCorrectChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  correctSpaces: number;
};

type Stats = {
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

export let invalid = false;
export let start: number, end: number;
export let start2: number, end2: number;
export let start3: number, end3: number;
export let lastSecondNotRound = false;

export let lastResult: Omit<CompletedEvent, "hash" | "uid">;

export function setLastResult(result: CompletedEvent): void {
  lastResult = result;
}

export function getStats(): unknown {
  const ret = {
    lastResult,
    start,
    end,
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
    wordsHistory: TestWords.words.list.slice(0, TestInput.input.history.length),
    inputHistory: TestInput.input.history,
  };

  try {
    // @ts-expect-error
    ret.keypressTimings.spacing.average =
      TestInput.keypressTimings.spacing.array.reduce(
        (previous, current) => (current += previous)
      ) / TestInput.keypressTimings.spacing.array.length;

    // @ts-expect-error
    ret.keypressTimings.spacing.sd = Numbers.stdDev(
      TestInput.keypressTimings.spacing.array
    );
  } catch (e) {
    //
  }
  try {
    // @ts-expect-error
    ret.keypressTimings.duration.average =
      TestInput.keypressTimings.duration.array.reduce(
        (previous, current) => (current += previous)
      ) / TestInput.keypressTimings.duration.array.length;

    // @ts-expect-error
    ret.keypressTimings.duration.sd = Numbers.stdDev(
      TestInput.keypressTimings.duration.array
    );
  } catch (e) {
    //
  }

  return ret;
}

export function restart(): void {
  start = 0;
  end = 0;
  invalid = false;
  lastSecondNotRound = false;
}

export let restartCount = 0;
export let incompleteSeconds = 0;

export let incompleteTests: IncompleteTest[] = [];

export function incrementRestartCount(): void {
  restartCount++;
}

export function incrementIncompleteSeconds(val: number): void {
  incompleteSeconds += val;
}

export function pushIncompleteTest(acc: number, seconds: number): void {
  incompleteTests.push({ acc, seconds });
}

export function resetIncomplete(): void {
  restartCount = 0;
  incompleteSeconds = 0;
  incompleteTests = [];
}

export function setInvalid(): void {
  invalid = true;
}

export function calculateTestSeconds(now?: number): number {
  if (now === undefined) {
    return (end - start) / 1000;
  } else {
    return (now - start) / 1000;
  }
}

export function calculateWpmAndRaw(
  withDecimalPoints?: true
): MonkeyTypes.WpmAndRaw {
  const testSeconds = calculateTestSeconds(
    TestState.isActive ? performance.now() : end
  );
  const chars = countChars();
  const wpm = Numbers.roundTo2(
    ((chars.correctWordChars + chars.correctSpaces) * (60 / testSeconds)) / 5
  );
  const raw = Numbers.roundTo2(
    ((chars.allCorrectChars +
      chars.spaces +
      chars.incorrectChars +
      chars.extraChars) *
      (60 / testSeconds)) /
      5
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
    if (Config.mode === "time") {
      extraAfk =
        Math.round(testSeconds) - TestInput.keypressCountHistory.length;
    } else {
      extraAfk = Math.ceil(testSeconds) - TestInput.keypressCountHistory.length;
    }
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

export function calculateBurst(): number {
  const containsKorean = TestInput.input.getKoreanStatus();
  const timeToWrite = (performance.now() - TestInput.currentBurstStart) / 1000;
  let wordLength: number;
  wordLength = !containsKorean
    ? TestInput.input.current.length
    : Hangul.disassemble(TestInput.input.current).length;
  if (wordLength === 0) {
    wordLength = !containsKorean
      ? TestInput.input.getHistoryLast()?.length ?? 0
      : Hangul.disassemble(TestInput.input.getHistoryLast() as string)
          ?.length ?? 0;
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
  TestInput.burstHistory.splice(testSeconds);
  TestInput.rawHistory.splice(testSeconds);
}

function getInputWords(): string[] {
  const containsKorean = TestInput.input.getKoreanStatus();

  let inputWords = [...TestInput.input.history];

  if (TestState.isActive) {
    inputWords.push(TestInput.input.current);
  }

  if (containsKorean) {
    inputWords = inputWords.map((w) => Hangul.disassemble(w).join(""));
  }

  return inputWords;
}

function getTargetWords(): string[] {
  const containsKorean = TestInput.input.getKoreanStatus();

  let targetWords = [
    ...(Config.mode === "zen" ? TestInput.input.history : TestWords.words.list),
  ];

  if (TestState.isActive) {
    targetWords.push(
      Config.mode === "zen"
        ? TestInput.input.current
        : TestWords.words.getCurrent()
    );
  }

  if (containsKorean) {
    targetWords = targetWords.map((w) => Hangul.disassemble(w).join(""));
  }

  return targetWords;
}

function countChars(): CharCount {
  let correctWordChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  let spaces = 0;
  let correctspaces = 0;

  const inputWords = getInputWords();
  const targetWords = getTargetWords();

  for (let i = 0; i < inputWords.length; i++) {
    const inputWord = inputWords[i] as string;
    const targetWord = targetWords[i] as string;

    if (inputWord === targetWord) {
      //the word is correct
      correctWordChars += targetWord.length;
      correctChars += targetWord.length;
      if (
        i < inputWords.length - 1 &&
        Strings.getLastChar(inputWord) !== "\n"
      ) {
        correctspaces++;
      }
    } else if (inputWord.length >= targetWord.length) {
      //too many chars
      for (let c = 0; c < inputWord.length; c++) {
        if (c < targetWord.length) {
          //on char that still has a word list pair
          if (inputWord[c] === targetWord[c]) {
            correctChars++;
          } else {
            incorrectChars++;
          }
        } else {
          //on char that is extra
          extraChars++;
        }
      }
    } else {
      //not enough chars
      const toAdd = {
        correct: 0,
        incorrect: 0,
        missed: 0,
      };
      for (let c = 0; c < targetWord.length; c++) {
        if (c < inputWord.length) {
          //on char that still has a word list pair
          if (inputWord[c] === targetWord[c]) {
            toAdd.correct++;
          } else {
            toAdd.incorrect++;
          }
        } else {
          //on char that is extra
          toAdd.missed++;
        }
      }
      correctChars += toAdd.correct;
      incorrectChars += toAdd.incorrect;
      if (i === inputWords.length - 1 && Config.mode === "time") {
        //last word - check if it was all correct - add to correct word chars
        if (toAdd.incorrect === 0) correctWordChars += toAdd.correct;
      } else {
        missedChars += toAdd.missed;
      }
    }
    if (i < inputWords.length - 1) {
      spaces++;
    }
  }
  if (
    FunboxList.get(Config.funbox).find((f) => f.properties?.includes("nospace"))
  ) {
    spaces = 0;
    correctspaces = 0;
  }
  return {
    spaces: spaces,
    correctWordChars: correctWordChars,
    allCorrectChars: correctChars,
    incorrectChars:
      Config.mode === "zen" ? TestInput.accuracy.incorrect : incorrectChars,
    extraChars: extraChars,
    missedChars: missedChars,
    correctSpaces: correctspaces,
  };
}

export function calculateStats(): Stats {
  console.debug("Calculating result stats");
  let testSeconds = calculateTestSeconds();
  console.debug(
    "Test seconds",
    testSeconds,
    " (date based) ",
    (end2 - start2) / 1000,
    " (performance.now based)",
    (end3 - start3) / 1000,
    " (new Date based)"
  );
  console.debug(
    "Test seconds",
    Numbers.roundTo1(testSeconds),
    " (date based) ",
    Numbers.roundTo1((end2 - start2) / 1000),
    " (performance.now based)",
    Numbers.roundTo1((end3 - start3) / 1000),
    " (new Date based)"
  );
  if (Config.mode !== "custom") {
    testSeconds = Numbers.roundTo2(testSeconds);
    console.debug(
      "Mode is not custom - rounding to 2. New time: ",
      testSeconds
    );
  }
  const chars = countChars();
  const { wpm, raw } = calculateWpmAndRaw(true);
  const acc = Numbers.roundTo2(calculateAccuracy());
  const ret = {
    wpm: isNaN(wpm) ? 0 : wpm,
    wpmRaw: isNaN(raw) ? 0 : raw,
    acc: acc,
    correctChars: chars.correctWordChars,
    incorrectChars: chars.incorrectChars,
    missedChars: chars.missedChars,
    extraChars: chars.extraChars,
    allChars:
      chars.allCorrectChars +
      chars.spaces +
      chars.incorrectChars +
      chars.extraChars,
    time: Numbers.roundTo2(testSeconds),
    spaces: chars.spaces,
    correctSpaces: chars.correctSpaces,
  };
  console.debug("Result stats", ret);
  return ret;
}
