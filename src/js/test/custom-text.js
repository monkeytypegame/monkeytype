export let text = "The quick brown fox jumps over the lazy dog".split(" ");
export let isWordRandom = false;
export let isTimeRandom = false;
export let word = "";
export let time = "";
export let delimiter = " ";

export function setText(txt) {
  text = txt;
}

export function setIsWordRandom(val) {
  isWordRandom = val;
}

export function setIsTimeRandom(val) {
  isTimeRandom = val;
}

export function setTime(val) {
  time = val;
}

export function setWord(val) {
  word = val;
}

export function setDelimiter(val) {
  delimiter = val;
}
