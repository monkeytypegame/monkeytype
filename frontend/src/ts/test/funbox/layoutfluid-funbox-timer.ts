import { animate } from "animejs";
import { capitalizeFirstLetter } from "../../utils/strings";
import { applyReducedMotion } from "../../utils/misc";

const timerEl = document.querySelector(
  "#typingTest #layoutfluidTimer"
) as HTMLElement;

export function show(): void {
  animate(timerEl, {
    opacity: 1,
    duration: applyReducedMotion(125),
  });
}

export function hide(): void {
  animate(timerEl, {
    opacity: 0,
    duration: applyReducedMotion(125),
  });
}

export function updateTime(sec: number, layout: string): void {
  timerEl.textContent = `${capitalizeFirstLetter(layout)} in: ${sec}s`;
}

export function updateWords(words: number, layout: string): void {
  const layoutName = capitalizeFirstLetter(layout.replace(/_/g, " "));
  let str = `${layoutName} in: ${words} words`;
  if (words === 1) {
    str = `${layoutName} starting next word`;
  }
  timerEl.textContent = str;
}
