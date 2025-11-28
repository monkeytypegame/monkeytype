import { animate } from "animejs";
import { applyReducedMotion } from "../../utils/misc";

let memoryTimer: number | null = null;
let memoryInterval: NodeJS.Timeout | null = null;

const timerEl = document.querySelector(
  "#typingTest #memoryTimer",
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
      $("#wordsWrapper").addClass("hidden");
    }
  }, 1000);
}

export function update(sec: number): void {
  timerEl.textContent = `Timer left to memorise all words: ${sec}s`;
}
