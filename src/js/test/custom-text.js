let wordParams = new URL(window.location.href).searchParams.get("custom");
let defaultText = "The quick brown fox jumps over the lazy dog";

export let urlWordSeparator = "|";
export let text = wordParams
  ? wordParams.split(urlWordSeparator)
  : defaultText.split(" ");
export let isWordRandom = false;
export let isTimeRandom = false;
export let word = "";
export let time = "";

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
