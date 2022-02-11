import Config from "../config";
import * as Misc from "../misc";
import * as TestInput from "./test-input";
import * as TestWords from "./test-words";

export let invalid = false;
export let start, end;
export let start2, end2;
export let lastSecondNotRound = false;

export function getStats() {
  let ret = {
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
        TestInput.keypressTimings.spacing.array.reduce(
          (previous, current) => (current += previous)
        ) / TestInput.keypressTimings.spacing.array.length,
      sd: Misc.stdDev(TestInput.keypressTimings.spacing.array),
    };
  } catch (e) {
    //
  }
  try {
    ret.keyDurationStats = {
      average:
        TestInput.keypressTimings.duration.array.reduce(
          (previous, current) => (current += previous)
        ) / TestInput.keypressTimings.duration.array.length,
      sd: Misc.stdDev(TestInput.keypressTimings.duration.array),
    };
  } catch (e) {
    //
  }

  return ret;
}

export function restart() {
  start = 0;
  end = 0;
  invalid = false;
  lastSecondNotRound = false;
}

export let restartCount = 0;
export let incompleteSeconds = 0;

export function incrementRestartCount() {
  restartCount++;
}

export function incrementIncompleteSeconds(val) {
  incompleteSeconds += val;
}

export function resetIncomplete() {
  restartCount = 0;
  incompleteSeconds = 0;
}

export function setInvalid() {
  invalid = true;
}

export function calculateTestSeconds(now) {
  if (now === undefined) {
    let endAfkSeconds = (end - TestInput.lastKeypress) / 1000;
    if ((Config.mode == "zen" || TestInput.bailout) && endAfkSeconds < 7) {
      return (TestInput.lastKeypress - start) / 1000;
    } else {
      return (end - start) / 1000;
    }
  } else {
    return (now - start) / 1000;
  }
}

export function setEnd(e) {
  end = e;
  end2 = Date.now();
}

export function setStart(s) {
  start = s;
  start2 = Date.now();
}

export function calculateAfkSeconds(testSeconds) {
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
  let ret = TestInput.keypressPerSecond.filter((x) => x.afk).length;
  return ret + extraAfk;
}

export function setLastSecondNotRound() {
  lastSecondNotRound = true;
}

export function calculateBurst() {
  let timeToWrite = (performance.now() - TestInput.currentBurstStart) / 1000;
  let wordLength;
  if (Config.mode === "zen") {
    wordLength = TestInput.input.current.length;
    if (wordLength == 0) {
      wordLength = TestInput.input.getHistoryLast().length;
    }
  } else {
    wordLength = TestWords.words.getCurrent().length;
  }
  let speed = Misc.roundTo2((wordLength * (60 / timeToWrite)) / 5);
  return Math.round(speed);
}

export function calculateAccuracy() {
  let acc =
    (TestInput.accuracy.correct /
      (TestInput.accuracy.correct + TestInput.accuracy.incorrect)) *
    100;
  return isNaN(acc) ? 100 : acc;
}

export function removeAfkData() {
  let testSeconds = calculateTestSeconds();
  TestInput.keypressPerSecond.splice(testSeconds);
  TestInput.keypressTimings.duration.array.splice(testSeconds);
  TestInput.keypressTimings.spacing.array.splice(testSeconds);
  TestInput.wpmHistory.splice(testSeconds);
}

function countChars() {
  let correctWordChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  let spaces = 0;
  let correctspaces = 0;
  for (let i = 0; i < TestInput.input.history.length; i++) {
    let word =
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
        Misc.getLastChar(TestInput.input.getHistory(i)) !== "\n"
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
      let toAdd = {
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

export function calculateStats() {
  let testSeconds = calculateTestSeconds();
  console.log((end2 - start2) / 1000);
  console.log(testSeconds);
  if (Config.mode != "custom") {
    testSeconds = Misc.roundTo2(testSeconds);
  }
  let chars = countChars();
  let wpm = Misc.roundTo2(
    ((chars.correctWordChars + chars.correctSpaces) * (60 / testSeconds)) / 5
  );
  let wpmraw = Misc.roundTo2(
    ((chars.allCorrectChars +
      chars.spaces +
      chars.incorrectChars +
      chars.extraChars) *
      (60 / testSeconds)) /
      5
  );
  let acc = Misc.roundTo2(calculateAccuracy());
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
    time: testSeconds,
    spaces: chars.spaces,
    correctSpaces: chars.correctSpaces,
  };
}
