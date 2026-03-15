import { applyReducedMotion } from "../../utils/misc";
import { qs } from "../../utils/dom";

let memoryTimer: number | null = null;
let memoryInterval: NodeJS.Timeout | null = null;

const timerEl = qs("#typingTest #memoryTimer");

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

export function reset(): void {
  if (memoryInterval !== null) {
    clearInterval(memoryInterval);
    memoryInterval = null;
  }
  memoryTimer = null;
  hide();
}

export function start(time: number): void {
  reset();
  memoryTimer = time;
  update(memoryTimer);
  show();
  memoryInterval = setInterval(() => {
    if (memoryTimer === null) return;
    memoryTimer -= 1;
    memoryTimer === 0 ? hide() : update(memoryTimer);
    if (memoryTimer <= 0) {
      reset();
      qs("#wordsWrapper")?.hide();
    }
  }, 1000);
}

export function update(sec: number): void {
  timerEl?.setText(`Timer left to memorise all words: ${sec}s`);
}
