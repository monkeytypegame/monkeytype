class Words {
  constructor() {
    this.list = [];
    this.length = 0;
    this.currentIndex = 0;
  }
  get(i) {
    if (i === undefined) {
      return this.list;
    } else {
      return this.list[i];
    }
  }
  getCurrent() {
    return this.list[this.currentIndex];
  }
  getLast() {
    return this.list[this.list.length - 1];
  }
  push(word) {
    this.list.push(word);
    this.length = this.list.length;
  }
  reset() {
    this.list = [];
    this.currentIndex = 0;
    this.length = this.list.length;
  }
  resetCurrentIndex() {
    this.currentIndex = 0;
  }
  decreaseCurrentIndex() {
    this.currentIndex--;
  }
  increaseCurrentIndex() {
    this.currentIndex++;
  }
}

class Input {
  constructor() {
    this.current = "";
    this.history = [];
  }

  reset() {
    this.current = "";
    this.history = [];
  }

  resetHistory() {
    this.history = [];
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

  pushHistory() {
    this.history.push(this.current);
    this.historyLength = this.history.length;
    this.resetCurrent();
  }

  popHistory() {
    return this.history.pop();
  }

  getHistory(i) {
    return this.history[i];
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
  }
}

export let active = false;
export let words = new Words();
export let input = new Input();
export let corrected = new Corrected();
export let currentWordIndex = 0;
export let isRepeated = false;
export let hasTab = false;
export let randomQuote = null;
export let bailout = false;

export function setActive(tf) {
  active = tf;
}

export function setRepeated(tf) {
  isRepeated = tf;
}

export function setHasTab(tf) {
  hasTab = tf;
}

export function setBailout(tf) {
  bailout = tf;
}

export function setRandomQuote(rq) {
  randomQuote = rq;
}
