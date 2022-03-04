export let text = "The quick brown fox jumps over the lazy dog".split(" ");
export let isWordRandom = false;
export let isTimeRandom = false;
export let word: number;
export let time: number;
export let delimiter = " ";

export function setText(txt: string[]): void {
  text = txt;
}

export function setIsWordRandom(val: boolean): void {
  isWordRandom = val;
}

export function setIsTimeRandom(val: boolean): void {
  isTimeRandom = val;
}

export function setTime(val: number): void {
  time = val;
}

export function setWord(val: number): void {
  word = val;
}

export function setDelimiter(val: string): void {
  delimiter = val;
}
