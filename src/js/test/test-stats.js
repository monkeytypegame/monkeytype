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

export function pushMissedWord(word) {
  if (!Object.keys(missedWords).includes(word)) {
    missedWords[word] = 1;
  } else {
    missedWords[word]++;
  }
}
