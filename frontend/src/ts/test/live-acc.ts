import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import { applyReducedMotion } from "../utils/misc";
import { animate } from "animejs";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";

const textEl = document.querySelector(
  "#liveStatsTextBottom .liveAcc",
) as HTMLElement;
const miniEl = document.querySelector("#liveStatsMini .acc") as HTMLElement;

export function update(acc: number): void {
  requestDebouncedAnimationFrame("live-acc.update", () => {
    let number = Math.floor(acc);
    if (Config.blindMode) {
      number = 100;
    }
    miniEl.innerHTML = number + "%";
    textEl.innerHTML = number + "%";
  });
}

export function reset(): void {
  requestDebouncedAnimationFrame("live-acc.reset", () => {
    miniEl.innerHTML = "100%";
    textEl.innerHTML = "100%";
  });
}

let state = false;

export function show(): void {
  if (Config.liveAccStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
  requestDebouncedAnimationFrame("live-acc.show", () => {
    if (Config.liveAccStyle === "mini") {
      miniEl.classList.remove("hidden");
      animate(miniEl, {
        opacity: [0, 1],
        duration: applyReducedMotion(125),
      });
    } else {
      textEl.classList.remove("hidden");
      animate(textEl, {
        opacity: [0, 1],
        duration: applyReducedMotion(125),
      });
    }
    state = true;
  });
}

export function hide(): void {
  if (!state) return;
  requestDebouncedAnimationFrame("live-acc.hide", () => {
    animate(textEl, {
      opacity: [1, 0],
      duration: applyReducedMotion(125),
      onComplete: () => {
        textEl.classList.add("hidden");
      },
    });
    animate(miniEl, {
      opacity: [1, 0],
      duration: applyReducedMotion(125),
      onComplete: () => {
        miniEl.classList.add("hidden");
      },
    });
    state = false;
  });
}

export function instantHide(): void {
  if (!state) return;

  textEl.classList.add("hidden");
  textEl.style.opacity = "0";
  miniEl.classList.add("hidden");
  miniEl.style.opacity = "0";

  state = false;
}

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "liveAccStyle") newValue === "off" ? hide() : show();
});
