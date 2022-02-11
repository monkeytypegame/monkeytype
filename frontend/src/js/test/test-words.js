class Words {
  constructor() {
    this.list = [];
    this.length = 0;
    this.currentIndex = 0;
  }
  get(i, raw = false) {
    if (i === undefined) {
      return this.list;
    } else {
      if (raw) {
        return this.list[i]?.replace(/[.?!":\-,]/g, "")?.toLowerCase();
      } else {
        return this.list[i];
      }
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
  clean() {
    for (let s of this.list) {
      if (/ +/.test(s)) {
        let id = this.list.indexOf(s);
        let tempList = s.split(" ");
        this.list.splice(id, 1);
        for (let i = 0; i < tempList.length; i++) {
          this.list.splice(id + i, 0, tempList[i]);
        }
      }
    }
  }
}
export let words = new Words();
export let hasTab = false;
export let randomQuote = null;

export function setRandomQuote(rq) {
  randomQuote = rq;
}

export function setHasTab(tf) {
  hasTab = tf;
}
