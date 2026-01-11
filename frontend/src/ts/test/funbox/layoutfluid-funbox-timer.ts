import { capitalizeFirstLetter } from "../../utils/strings";
import { applyReducedMotion } from "../../utils/misc";
import { qs } from "../../utils/dom";

const timerEl = qs("#typingTest #layoutfluidTimer");

export function show(): void {
  timerEl?.animate({
    opacity: 1,
    duration: applyReducedMotion(125),
  });
}

export function hide(): void {
  timerEl?.animate({
    opacity: 0,
    duration: applyReducedMotion(125),
  });
}

export function instantHide(): void {
  timerEl?.setStyle({ opacity: "0" });
}

export function updateTime(sec: number, layout: string): void {
  timerEl?.setText(`${capitalizeFirstLetter(layout)} in: ${sec}s`);
}

export function updateWords(words: number, layout: string): void {
  const layoutName = capitalizeFirstLetter(layout.replace(/_/g, " "));
  let str = `${layoutName} in: ${words} words`;
  if (words === 1) {
    str = `${layoutName} starting next word`;
  }
  timerEl?.setText(str);
}
