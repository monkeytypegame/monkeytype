import Hangul from "hangul-js";
import Config from "../config";
import * as Misc from "../utils/misc";
import * as TestInput from "./test-input";
import * as TestWords from "./test-words";
import * as FunboxList from "./funbox/funbox-list";

interface CharCount {
  spaces: number;
  correctWordChars: number;
  allCorrectChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  correctSpaces: number;
}

interface Keypress {
  count: number;
  errors: number;
  words: number[];
  afk: boolean;
}

interface KeypressTimings {
  spacing: {
    current: number;
    array: number[] | "toolong";
  };
  duration: {
    current: number;
    array: number[] | "toolong";
  };
}

interface DebugStats {
  lastResult?: MonkeyTypes.Result<MonkeyTypes.Mode>;
  start: number;
  end: number;
  wpmHistory: number[];
  rawHistory: number[];
  burstHistory: number[];
  keypressPerSecond: Keypress[];
  currentKeypress: {
    count: number;
    errors: number;
    words: number[];
    afk: boolean;
  };
  lastKeypress: number;
  currentBurstStart: number;
  lastSecondNotRound: boolean;
  missedWords: {
    [word: string]: number;
  };
  accuracy: {
    correct: number;
    incorrect: number;
  };
  keypressTimings: KeypressTimings;
  keySpacingStats?: {
    average: number;
    sd: number;
  };
  keyDurationStats?: {
    average: number;
    sd: number;
  };
}

interface Stats {
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
}

export let invalid = false;
export let start: number, end: number;
export let start2: number, end2: number;
export let lastSecondNotRound = false;

export let lastTestWpm = 0;

export function setLastTestWpm(wpm: number): void {
  lastTestWpm = wpm;
}

export let lastResult: MonkeyTypes.Result<MonkeyTypes.Mode>;

export function setLastResult(
  result: MonkeyTypes.Result<MonkeyTypes.Mode>
): void {
  lastResult = result;
}

let wpmCalcDebug = false;
export function wpmCalculationDebug(): void {
  console.log("wpm calculation debug enabled");
  wpmCalcDebug = true;
}

export function getStats(): DebugStats {
  const ret: DebugStats = {
    lastResult,
    start,
    end,
    wpmHistory: TestInput.wpmHistory,
    rawHistory: TestInput.rawHistory,
    burstHistory: TestInput.burstHistory,
    keypressPerSecond: TestInput.keypressPerSecond,
    currentKeypress: TestInput.currentKeypress,
    lastKeypress: TestInput.lastKeypress,
    currentBurstStart: TestInput.currentBurstStart,
    lastSecondNotRound,
    missedWords: TestInput.missedWords,
    accuracy: TestInput.accuracy,
    keypressTimings: TestInput.keypressTimings,
  };

  try {
    ret.keySpacingStats = {
      average:
        (TestInput.keypressTimings.spacing.array as number[]).reduce(
          (previous, current) => (current += previous)
        ) / TestInput.keypressTimings.spacing.array.length,
      sd: Misc.stdDev(TestInput.keypressTimings.spacing.array as number[]),
    };
  } catch (e) {
    //
  }
  try {
    ret.keyDurationStats = {
      average:
        (TestInput.keypressTimings.duration.array as number[]).reduce(
          (previous, current) => (current += previous)
        ) / TestInput.keypressTimings.duration.array.length,
      sd: Misc.stdDev(TestInput.keypressTimings.duration.array as number[]),
    };
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

export let incompleteTests: MonkeyTypes.IncompleteTest[] = [];

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
    const endAfkSeconds = (end - TestInput.lastKeypress) / 1000;
    if ((Config.mode == "zen" || TestInput.bailout) && endAfkSeconds < 7) {
      return (TestInput.lastKeypress - start) / 1000;
    } else {
      return (end - start) / 1000;
    }
  } else {
    return (now - start) / 1000;
  }
}
let avg = 0;
export function calculateWpmAndRaw(): MonkeyTypes.WordsPerMinuteAndRaw {
  const start = performance.now();
  const containsKorean = TestInput.input.getKoreanStatus();
  let chars = 0;
  let correctWordChars = 0;
  let spaces = 0;

  const currTestInput = !containsKorean
    ? TestInput.input.current
    : Hangul.disassemble(TestInput.input.current);

  //check input history
  for (let i = 0; i < TestInput.input.history.length; i++) {
    const word: string = !containsKorean
      ? //english
        Config.mode == "zen"
        ? (TestInput.input.getHistory(i) as string)
        : TestWords.words.get(i)
      : //korean
      Config.mode == "zen"
      ? Hangul.disassemble(TestInput.input.getHistory(i) as string).join("")
      : Hangul.disassemble(TestWords.words.get(i)).join("");

    const historyWord: string = !containsKorean
      ? (TestInput.input.getHistory(i) as string)
      : Hangul.disassemble(TestInput.input.getHistory(i) as string).join("");

    if (historyWord === word) {
      //the word is correct
      //+1 for space
      correctWordChars += word.length;
      if (
        i < TestInput.input.history.length - 1 &&
        Misc.getLastChar(TestInput.input.getHistory(i) as string) !== "\n"
      ) {
        spaces++;
      }
    }
    chars += !containsKorean
      ? TestInput.input.getHistory(i).length
      : Hangul.disassemble(TestInput.input.getHistory(i) as string).length;
  }
  if (currTestInput !== "") {
    const word =
      Config.mode == "zen"
        ? currTestInput
        : !containsKorean
        ? TestWords.words.getCurrent()
        : Hangul.disassemble(TestWords.words.getCurrent() ?? "");
    //check whats currently typed
    const toAdd = {
      correct: 0,
      incorrect: 0,
      missed: 0,
    };
    for (let c = 0; c < word.length; c++) {
      if (c < currTestInput.length) {
        //on char that still has a word list pair
        if (currTestInput[c] === word[c]) {
          toAdd.correct++;
        } else {
          toAdd.incorrect++;
        }
      } else {
        //on char that is extra
        toAdd.missed++;
      }
    }
    chars += toAdd.correct;
    chars += toAdd.incorrect;
    chars += toAdd.missed;
    if (toAdd.incorrect == 0) {
      //word is correct so far, add chars
      correctWordChars += toAdd.correct;
    }
  }
  if (
    FunboxList.get(Config.funbox).find((f) => f.properties?.includes("nospace"))
  ) {
    spaces = 0;
  }
  chars += currTestInput.length;
  const testSeconds = calculateTestSeconds(performance.now());
  const wpm = Math.round(
    ((correctWordChars + spaces) * (60 / testSeconds)) / 5
  );
  const raw = Math.round(((chars + spaces) * (60 / testSeconds)) / 5);
  const end = performance.now();
  avg = (end - start + avg) / 2;
  return {
    wpm: wpm,
    raw: raw,
  };
}

export function setEnd(e: number): void {
  end = e;
  end2 = Date.now();
}

export function setStart(s: number): void {
  start = s;
  start2 = Date.now();
}

export function calculateAfkSeconds(testSeconds: number): number {
  let extraAfk = 0;
  if (testSeconds !== undefined) {
    if (Config.mode === "time") {
      extraAfk = Math.round(testSeconds) - TestInput.keypressPerSecond.length;
    } else {
      extraAfk = Math.ceil(testSeconds) - TestInput.keypressPerSecond.length;
    }
    if (extraAfk < 0) extraAfk = 0;
    // console.log("-- extra afk debug");
    // console.log("should be " + Math.ceil(testSeconds));
    // console.log(keypressPerSecond.length);
    // console.log(
    //   `gonna add extra ${extraAfk} seconds of afk because of no keypress data`
    // );
  }
  const ret = TestInput.keypressPerSecond.filter((x) => x.afk).length;
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
  if (wordLength == 0) {
    wordLength = !containsKorean
      ? TestInput.input.getHistoryLast()?.length ?? 0
      : Hangul.disassemble(TestInput.input.getHistoryLast() as string)
          ?.length ?? 0;
  }
  if (wordLength == 0) return 0;
  const speed = Misc.roundTo2((wordLength * (60 / timeToWrite)) / 5);
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
  TestInput.keypressPerSecond.splice(testSeconds);
  TestInput.wpmHistory.splice(testSeconds);
  TestInput.burstHistory.splice(testSeconds);
  TestInput.rawHistory.splice(testSeconds);
}

function countChars(): CharCount {
  let correctWordChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  let spaces = 0;
  let correctspaces = 0;
  for (let i = 0; i < TestInput.input.history.length; i++) {
    const containsKorean = TestInput.input.getKoreanStatus();
    const word: string = !containsKorean
      ? //english
        Config.mode == "zen"
        ? (TestInput.input.getHistory(i) as string)
        : TestWords.words.get(i)
      : //korean
      Config.mode == "zen"
      ? Hangul.disassemble(TestInput.input.getHistory(i) as string).join("")
      : Hangul.disassemble(TestWords.words.get(i)).join("");

    if (TestInput.input.getHistory(i) === "") {
      //last word that was not started
      continue;
    }
    const historyWord: string = !containsKorean
      ? (TestInput.input.getHistory(i) as string)
      : Hangul.disassemble(TestInput.input.getHistory(i) as string).join("");

    if (historyWord == word) {
      //the word is correct
      correctWordChars += word.length;
      correctChars += word.length;
      if (
        i < TestInput.input.history.length - 1 &&
        Misc.getLastChar(historyWord as string) !== "\n"
      ) {
        correctspaces++;
      }
    } else if (historyWord.length >= word.length) {
      //too many chars
      for (let c = 0; c < historyWord.length; c++) {
        if (c < word.length) {
          //on char that still has a word list pair
          if (historyWord[c] == word[c]) {
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
      for (let c = 0; c < word.length; c++) {
        if (c < historyWord.length) {
          //on char that still has a word list pair
          if (historyWord[c] == word[c]) {
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
      if (i === TestInput.input.history.length - 1 && Config.mode == "time") {
        //last word - check if it was all correct - add to correct word chars
        if (toAdd.incorrect === 0) correctWordChars += toAdd.correct;
      } else {
        missedChars += toAdd.missed;
      }
    }
    if (i < TestInput.input.history.length - 1) {
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
      Config.mode == "zen" ? TestInput.accuracy.incorrect : incorrectChars,
    extraChars: extraChars,
    missedChars: missedChars,
    correctSpaces: correctspaces,
  };
}

export function calculateStats(): Stats {
  let testSeconds = calculateTestSeconds();
  if (wpmCalcDebug) {
    console.log("date based time", (end2 - start2) / 1000);
    console.log("performance.now based time", testSeconds);
  }
  if (Config.mode != "custom") {
    testSeconds = Misc.roundTo2(testSeconds);
    if (wpmCalcDebug) {
      console.log("mode is not custom - wounding");
      console.log("new time", testSeconds);
    }
  }
  const chars = countChars();
  const wpm = Misc.roundTo2(
    ((chars.correctWordChars + chars.correctSpaces) * (60 / testSeconds)) / 5
  );
  const wpmraw = Misc.roundTo2(
    ((chars.allCorrectChars +
      chars.spaces +
      chars.incorrectChars +
      chars.extraChars) *
      (60 / testSeconds)) /
      5
  );
  if (wpmCalcDebug) {
    console.log("chars", chars);
    console.log(
      "wpm",
      ((chars.correctWordChars + chars.correctSpaces) * (60 / testSeconds)) / 5
    );
    console.log("wpm rounded to 2", wpm);
    console.log("wpmraw", wpmraw);
  }
  const acc = Misc.roundTo2(calculateAccuracy());
  return {
    wpm: isNaN(wpm) ? 0 : wpm,
    wpmRaw: isNaN(wpmraw) ? 0 : wpmraw,
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
    time: Misc.roundTo2(testSeconds),
    spaces: chars.spaces,
    correctSpaces: chars.correctSpaces,
  };
}
