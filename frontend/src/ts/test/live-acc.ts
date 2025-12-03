import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import { applyReducedMotion } from "../utils/misc";
import { animate } from "animejs";

const textEl = document.querySelector(
  "#liveStatsTextBottom .liveAcc",
) as Element;
const miniEl = document.querySelector("#liveStatsMini .acc") as Element;

export function update(acc: number): void {
  let number = Math.floor(acc);
  if (Config.blindMode) {
    number = 100;
  }
  miniEl.innerHTML = number + "%";
  textEl.innerHTML = number + "%";
}

export function reset(): void {
  miniEl.innerHTML = "100%";
  textEl.innerHTML = "100%";
}

let state = false;

export function show(): void {
  if (Config.liveAccStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
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
}

export function hide(): void {
  if (!state) return;
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
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "liveAccStyle") eventValue === "off" ? hide() : show();
});
