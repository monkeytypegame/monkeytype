class Input {
  constructor() {
    this.current = "";
    this.history = [];
    this.length = 0;
  }

  reset() {
    this.current = "";
    this.history = [];
    this.length = 0;
  }

  resetHistory() {
    this.history = [];
    this.length = 0;
  }

  setCurrent(val) {
    this.current = val;
    this.length = this.current.length;
  }

  appendCurrent(val) {
    this.current += val;
    this.length = this.current.length;
  }

  resetCurrent() {
    this.current = "";
  }

  getCurrent() {
    return this.current;
  }

  pushHistory() {
    this.history.push(this.current);
    this.historyLength = this.history.length;
    this.resetCurrent();
  }

  popHistory() {
    return this.history.pop();
  }

  getHistory(i) {
    if (i === undefined) {
      return this.history;
    } else {
      return this.history[i];
    }
  }

  getHistoryLast() {
    return this.history[this.history.length - 1];
  }
}

class Corrected {
  constructor() {
    this.current = "";
    this.history = [];
  }
  setCurrent(val) {
    this.current = val;
  }

  appendCurrent(val) {
    this.current += val;
  }

  resetCurrent() {
    this.current = "";
  }

  resetHistory() {
    this.history = [];
  }

  reset() {
    this.resetCurrent();
    this.resetHistory();
  }

  getHistory(i) {
    return this.history[i];
  }

  popHistory() {
    return this.history.pop();
  }

  pushHistory() {
    this.history.push(this.current);
    this.current = "";
  }
}

export let input = new Input();
export let corrected = new Corrected();

export let keypressPerSecond = [];
export let currentKeypress = {
  count: 0,
  errors: 0,
  words: [],
  afk: true,
};
export let lastKeypress;
export let currentBurstStart = 0;
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

export let spacingDebug = false;
export function enableSpacingDebug() {
  spacingDebug = true;
  console.clear();
}

export function updateLastKeypress() {
  lastKeypress = performance.now();
}

export function incrementKeypressCount() {
  currentKeypress.count++;
}

export function setKeypressNotAfk() {
  currentKeypress.afk = false;
}

export function incrementKeypressErrors() {
  currentKeypress.errors++;
}

export function pushKeypressWord(word) {
  currentKeypress.words.push(word);
}

export function setBurstStart(time) {
  currentBurstStart = time;
}

export function pushKeypressesToHistory() {
  keypressPerSecond.push(currentKeypress);
  currentKeypress = {
    count: 0,
    errors: 0,
    words: [],
    afk: true,
  };
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

function pushKeypressSpacing(val) {
  keypressTimings.spacing.array.push(val);
}

function setKeypressSpacing(val) {
  keypressTimings.spacing.current = val;
}

export function recordKeypressSpacing() {
  let now = performance.now();
  let diff = Math.abs(keypressTimings.spacing.current - now);
  if (keypressTimings.spacing.current !== -1) {
    pushKeypressSpacing(diff);
    if (spacingDebug)
      console.log(
        "spacing debug",
        "push",
        diff,
        "length",
        keypressTimings.spacing.array.length
      );
  }
  setKeypressSpacing(now);
  if (spacingDebug)
    console.log(
      "spacing debug",
      "set",
      now,
      "length",
      keypressTimings.spacing.array.length
    );
  if (spacingDebug)
    console.log(
      "spacing debug",
      "recorded",
      "length",
      keypressTimings.spacing.array.length
    );
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
  if (spacingDebug) console.clear();
}

export function pushMissedWord(word) {
  if (!Object.keys(missedWords).includes(word)) {
    missedWords[word] = 1;
  } else {
    missedWords[word]++;
  }
}

export function restart() {
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
      current: -1,
      array: [],
    },
    duration: {
      current: -1,
      array: [],
    },
  };
}
