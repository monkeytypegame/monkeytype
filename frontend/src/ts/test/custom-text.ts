import * as TribeConfig from "../tribe/tribe-config";

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

export function setText(txt: string[], tribeOverride: boolean): void {
  if (!TribeConfig.canChange(tribeOverride)) return;
  text = txt;
  if (!tribeOverride) TribeConfig.sync();
}

export function setIsWordRandom(val: boolean, tribeOverride: boolean): void {
  if (!TribeConfig.canChange(tribeOverride)) return;
  isWordRandom = val;
  if (!tribeOverride) TribeConfig.sync();
}

export function setIsTimeRandom(val: boolean, tribeOverride: boolean): void {
  if (!TribeConfig.canChange(tribeOverride)) return;
  isTimeRandom = val;
  if (!tribeOverride) TribeConfig.sync();
}

export function setTime(val: number, tribeOverride: boolean): void {
  if (!TribeConfig.canChange(tribeOverride)) return;
  time = val;
  if (!tribeOverride) TribeConfig.sync();
}

export function setWord(val: number, tribeOverride: boolean): void {
  if (!TribeConfig.canChange(tribeOverride)) return;
  word = val;
  if (!tribeOverride) TribeConfig.sync();
}

export function setDelimiter(val: string, tribeOverride: boolean): void {
  if (!TribeConfig.canChange(tribeOverride)) return;
  delimiter = val;
  if (!tribeOverride) TribeConfig.sync();
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
