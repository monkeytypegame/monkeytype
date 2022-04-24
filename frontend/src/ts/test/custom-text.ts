export let text = [
  "The",
  "quick",
  "brown",
  "fox",
  "jumps",
  "over",
  "the",
  "lazy",
  "dog",
];
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

type CustomTextObject = { [key: string]: string };

export function getCustomText(name: string): string[] {
  const customText = getCustomTextObject();

  return customText[name].split(/ +/);
}

export function setCustomText(name: string, text: string | string[]): void {
  const customText = getCustomTextObject();

  if (typeof text === "string") customText[name] = text;
  else customText[name] = text.join(" ");

  window.localStorage.setItem("customText", JSON.stringify(customText));
}

export function deleteCustomText(name: string): void {
  const customText = getCustomTextObject();

  if (customText[name]) delete customText[name];

  window.localStorage.setItem("customText", JSON.stringify(customText));
}

function getCustomTextObject(): CustomTextObject {
  return JSON.parse(window.localStorage.getItem("customText") ?? "{}");
}

export function getCustomTextNames(): string[] {
  return Object.keys(getCustomTextObject());
}
