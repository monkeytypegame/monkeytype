import Config from "../config";
import * as Misc from "../misc";
import * as TestInput from "./test-input";
import * as TestWords from "./test-words";

type CharCount = {
  spaces: number;
  correctWordChars: number;
  allCorrectChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  correctSpaces: number;
};

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

type DebugStats = {
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
export let lastSecondNotRound = false;

export let lastTestWpm = 0;

export function setLastTestWpm(wpm: number): void {
  lastTestWpm = wpm;
}

export function getStats(): DebugStats {
  const ret: DebugStats = {
    start,
    end,
    wpmHistory: TestInput.wpmHistory,
    rawHistory: TestInput.wpmHistory,
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

export function incrementRestartCount(): void {
  restartCount++;
}

export function incrementIncompleteSeconds(val: number): void {
  incompleteSeconds += val;
}

export function resetIncomplete(): void {
  restartCount = 0;
  incompleteSeconds = 0;
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

export function calculateWpmAndRaw(): MonkeyTypes.WordsPerMinuteAndRaw {
  let chars = 0;
  let correctWordChars = 0;
  let spaces = 0;
  //check input history
  for (let i = 0; i < TestInput.input.history.length; i++) {
    const word =
      Config.mode == "zen"
        ? TestInput.input.getHistory(i)
        : TestWords.words.get(i);
    if (TestInput.input.getHistory(i) == word) {
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
    chars += TestInput.input.getHistory(i).length;
  }
  if (TestInput.input.current !== "") {
    const word =
      Config.mode == "zen"
        ? TestInput.input.current
        : TestWords.words.getCurrent();
    //check whats currently typed
    const toAdd = {
      correct: 0,
      incorrect: 0,
      missed: 0,
    };
    for (let c = 0; c < word.length; c++) {
      if (c < TestInput.input.current.length) {
        //on char that still has a word list pair
        if (TestInput.input.current[c] == word[c]) {
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
  if (Config.funbox === "nospace" || Config.funbox === "arrows") {
    spaces = 0;
  }
  chars += TestInput.input.current.length;
  const testSeconds = calculateTestSeconds(performance.now());
  const wpm = Math.round(
    ((correctWordChars + spaces) * (60 / testSeconds)) / 5
  );
  const raw = Math.round(((chars + spaces) * (60 / testSeconds)) / 5);
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
  const timeToWrite = (performance.now() - TestInput.currentBurstStart) / 1000;
  let wordLength;
  wordLength = TestInput.input.current.length;
  if (wordLength == 0) {
    wordLength = TestInput.input.getHistoryLast().length;
  }
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
  (TestInput.keypressTimings.duration.array as number[]).splice(testSeconds);
  (TestInput.keypressTimings.spacing.array as number[]).splice(testSeconds);
  TestInput.wpmHistory.splice(testSeconds);
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
    const word =
      Config.mode == "zen"
        ? TestInput.input.getHistory(i)
        : TestWords.words.get(i);
    if (TestInput.input.getHistory(i) === "") {
      //last word that was not started
      continue;
    }
    if (TestInput.input.getHistory(i) == word) {
      //the word is correct
      correctWordChars += word.length;
      correctChars += word.length;
      if (
        i < TestInput.input.history.length - 1 &&
        Misc.getLastChar(TestInput.input.getHistory(i) as string) !== "\n"
      ) {
        correctspaces++;
      }
    } else if (TestInput.input.getHistory(i).length >= word.length) {
      //too many chars
      for (let c = 0; c < TestInput.input.getHistory(i).length; c++) {
        if (c < word.length) {
          //on char that still has a word list pair
          if (TestInput.input.getHistory(i)[c] == word[c]) {
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
        if (c < TestInput.input.getHistory(i).length) {
          //on char that still has a word list pair
          if (TestInput.input.getHistory(i)[c] == word[c]) {
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
  if (Config.funbox === "nospace" || Config.funbox === "arrows") {
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
  // console.log((end2 - start2) / 1000);
  // console.log(testSeconds);
  if (Config.mode != "custom") {
    testSeconds = Misc.roundTo2(testSeconds);
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
