import * as TribeConfig from "./tribe-config";

export let text = "The quick brown fox jumps over the lazy dog".split(" ");
export let isWordRandom = false;
export let isTimeRandom = false;
export let word = "";
export let time = "";
export let delimiter = " ";

export function setText(txt, tribeOverride) {
  if (!TribeConfig.canChange(tribeOverride)) return;
  text = txt;
  if (!tribeOverride) TribeConfig.sync();
}

export function setIsWordRandom(val, tribeOverride) {
  if (!TribeConfig.canChange(tribeOverride)) return;
  isWordRandom = val;
  if (!tribeOverride) TribeConfig.sync();
}

export function setIsTimeRandom(val, tribeOverride) {
  if (!TribeConfig.canChange(tribeOverride)) return;
  isTimeRandom = val;
  if (!tribeOverride) TribeConfig.sync();
}

export function setTime(val, tribeOverride) {
  if (!TribeConfig.canChange(tribeOverride)) return;
  time = val;
  if (!tribeOverride) TribeConfig.sync();
}

export function setWord(val, tribeOverride) {
  if (!TribeConfig.canChange(tribeOverride)) return;
  word = val;
  if (!tribeOverride) TribeConfig.sync();
}

export function setDelimiter(val, tribeOverride) {
  if (!TribeConfig.canChange(tribeOverride)) return;
  delimiter = val;
  if (!tribeOverride) TribeConfig.sync();
}
