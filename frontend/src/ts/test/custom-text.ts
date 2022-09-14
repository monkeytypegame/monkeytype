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
export let word = -1;
export let time = -1;
export let delimiter = " ";

export function setText(txt: string[]): void {
  text = txt;
}

export function getText(): string {
  return text.join(" ");
}

export function getTextArray(): string[] {
  return text;
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

type CustomTextObject = Record<string, string>;

export function getCustomText(name: string, progress = 0): string[] {
  const customTextObj = getCustomTextObject();

  if (progress >= customTextObj[name].length) {
    console.error("Custom text progress is greater than text length");
  } else {
    return customTextObj[name].split(" ").slice(progress);
  }

  return customTextObj[name].split(/ +/);
}

export function setCustomText(name: string, text: string | string[]): void {
  const customText = getCustomTextObject();

  if (typeof text === "string") customText[name] = text;
  else customText[name] = text.join(" ");

  window.localStorage.setItem("customText", JSON.stringify(customText));
}

export function getCustomTextProgress(name: string): number {
  const customTextProgress = getCustomTextProgressObject();

  return customTextProgress[name] ?? 0;
}

export function setCustomTextProgress(name: string, progress: number): void {
  const customTextProgress = getCustomTextProgressObject();

  customTextProgress[name] = progress;

  window.localStorage.setItem(
    "customTextProgress",
    JSON.stringify(customTextProgress)
  );
}

export function deleteCustomText(name: string): void {
  const customText = getCustomTextObject();

  if (customText[name]) delete customText[name];

  window.localStorage.setItem("customText", JSON.stringify(customText));
}

function getCustomTextObject(): CustomTextObject {
  return JSON.parse(window.localStorage.getItem("customText") ?? "{}");
}

export function getCustomTextProgressObject(): Record<string, number> {
  return JSON.parse(window.localStorage.getItem("customTextProgress") ?? "{}");
}

export function setCustomTextProgressObject(obj: Record<string, number>): void {
  window.localStorage.setItem("customTextProgress", JSON.stringify(obj));
}

export function getCustomTextNames(): string[] {
  return Object.keys(getCustomTextObject());
}
