import * as TestLogic from "./test-logic";
import Config from "./config";
import * as Funbox from "./funbox";
import * as Misc from "./misc";
import * as TestStats from "./test-stats";

export let invalid = false;
export let start, end;
export let wpmHistory = [];
export let rawHistory = [];

export let keypressPerSecond = [];
export let currentKeypress = {
  count: 0,
  mod: 0,
  errors: 0,
  words: [],
};

// export let errorsPerSecond = [];
// export let currentError = {
//   count: 0,
//   words: [],
// };
export let lastSecondNotRound = false;
export let missedWords = {};
export let accuracy = {
  correct: 0,
  incorrect: 0,
};
export let keypressTimings = {
  spacing: {
    current: -1,
    array: [],
  },
  duration: {
    current: -1,
    array: [],
  },
};

export function restart() {
  start = 0;
  end = 0;
  invalid = false;
  wpmHistory = [];
  rawHistory = [];
  keypressPerSecond = [];
  currentKeypress = {
    count: 0,
    mod: 0,
    errors: 0,
    words: [],
  };
  // errorsPerSecond = [];
  // currentError = {
  //   count: 0,
  //   words: [],
  // };
  lastSecondNotRound = false;
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
    return (end - start) / 1000;
  } else {
    return (now - start) / 1000;
  }
}

export function setEnd(e) {
  end = e;
}

export function setStart(s) {
  start = s;
}

export function pushToWpmHistory(word) {
  wpmHistory.push(word);
}

export function pushToRawHistory(word) {
  rawHistory.push(word);
}

export function incrementKeypressCount() {
  currentKeypress.count++;
}

export function incrementKeypressMod() {
  currentKeypress.mod++;
}

export function incrementKeypressErrors() {
  currentKeypress.errors++;
}

export function pushKeypressWord(word) {
  currentKeypress.words.push(word);
}

export function pushKeypressesToHistory() {
  keypressPerSecond.push(currentKeypress);
  currentKeypress = {
    count: 0,
    mod: 0,
    errors: 0,
    words: [],
  };
}

export function calculateAfkSeconds() {
  return keypressPerSecond.filter((x) => x.count == 0 && x.mod == 0).length;
}

export function setLastSecondNotRound() {
  lastSecondNotRound = true;
}

export function calculateAccuracy() {
  return (accuracy.correct / (accuracy.correct + accuracy.incorrect)) * 100;
}

export function incrementAccuracy(correctincorrect) {
  if (correctincorrect) {
    accuracy.correct++;
  } else {
    accuracy.incorrect++;
  }
}

export function setKeypressTimingsTooLong() {
  keypressTimings.spacing.array = "toolong";
  keypressTimings.duration.array = "toolong";
}

export function pushKeypressDuration(val) {
  keypressTimings.duration.array.push(val);
}

export function setKeypressDuration(val) {
  keypressTimings.duration.current = val;
}

export function pushKeypressSpacing(val) {
  keypressTimings.spacing.array.push(val);
}

export function setKeypressSpacing(val) {
  keypressTimings.spacing.current = val;
}

export function recordKeypressSpacing() {
  let now = performance.now();
  let diff = Math.abs(keypressTimings.spacing.current - now);
  if (keypressTimings.spacing.current !== -1) {
    pushKeypressSpacing(diff);
  }
  setKeypressSpacing(now);
}

export function resetKeypressTimings() {
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
}

export function pushMissedWord(word) {
  if (!Object.keys(missedWords).includes(word)) {
    missedWords[word] = 1;
  } else {
    missedWords[word]++;
  }
}

function countChars() {
  let correctWordChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  let spaces = 0;
  let correctspaces = 0;
  for (let i = 0; i < TestLogic.input.history.length; i++) {
    let word =
      Config.mode == "zen"
        ? TestLogic.input.getHistory(i)
        : TestLogic.words.get(i);
    if (TestLogic.input.getHistory(i) === "") {
      //last word that was not started
      continue;
    }
    if (TestLogic.input.getHistory(i) == word) {
      //the word is correct
      correctWordChars += word.length;
      correctChars += word.length;
      if (
        i < TestLogic.input.history.length - 1 &&
        Misc.getLastChar(TestLogic.input.getHistory(i)) !== "\n"
      ) {
        correctspaces++;
      }
    } else if (TestLogic.input.getHistory(i).length >= word.length) {
      //too many chars
      for (let c = 0; c < TestLogic.input.getHistory(i).length; c++) {
        if (c < word.length) {
          //on char that still has a word list pair
          if (TestLogic.input.getHistory(i)[c] == word[c]) {
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
        if (c < TestLogic.input.getHistory(i).length) {
          //on char that still has a word list pair
          if (TestLogic.input.getHistory(i)[c] == word[c]) {
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
      if (i === TestLogic.input.history.length - 1 && Config.mode == "time") {
        //last word - check if it was all correct - add to correct word chars
        if (toAdd.incorrect === 0) correctWordChars += toAdd.correct;
      } else {
        missedChars += toAdd.missed;
      }
    }
    if (i < TestLogic.input.history.length - 1) {
      spaces++;
    }
  }
  if (Funbox.active === "nospace") {
    spaces = 0;
    correctspaces = 0;
  }
  return {
    spaces: spaces,
    correctWordChars: correctWordChars,
    allCorrectChars: correctChars,
    incorrectChars:
      Config.mode == "zen" ? TestStats.accuracy.incorrect : incorrectChars,
    extraChars: extraChars,
    missedChars: missedChars,
    correctSpaces: correctspaces,
  };
}

export function calculateStats() {
  let testSeconds = TestStats.calculateTestSeconds();
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
  let acc = Misc.roundTo2(TestStats.calculateAccuracy());
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
