import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import Format from "../utils/format";
import { applyReducedMotion } from "../utils/misc";
import { animate } from "animejs";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";

const textEl = document.querySelector(
  "#liveStatsTextBottom .liveBurst",
) as Element;
const miniEl = document.querySelector("#liveStatsMini .burst") as Element;

export function reset(): void {
  requestDebouncedAnimationFrame("live-burst.reset", () => {
    textEl.innerHTML = "0";
    miniEl.innerHTML = "0";
  });
}

export async function update(burst: number): Promise<void> {
  requestDebouncedAnimationFrame("live-burst.update", () => {
    const burstText = Format.typingSpeed(burst, { showDecimalPlaces: false });
    miniEl.innerHTML = burstText;
    textEl.innerHTML = burstText;
  });
}

let state = false;

export function show(): void {
  if (Config.liveBurstStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
  requestDebouncedAnimationFrame("live-burst.show", () => {
    if (Config.liveBurstStyle === "mini") {
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
  requestDebouncedAnimationFrame("live-burst.hide", () => {
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

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "liveBurstStyle") newValue === "off" ? hide() : show();
});
