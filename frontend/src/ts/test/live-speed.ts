import Config from "../config";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";
import Format from "../utils/format";
import { applyReducedMotion } from "../utils/misc";
import { animate } from "animejs";

const textElement = document.querySelector(
  "#liveStatsTextBottom .liveSpeed",
) as Element;
const miniElement = document.querySelector("#liveStatsMini .speed") as Element;

export function reset(): void {
  textElement.innerHTML = "0";
  miniElement.innerHTML = "0";
}

export function update(wpm: number, raw: number): void {
  let number = wpm;
  if (Config.blindMode) {
    number = raw;
  }
  const numberText = Format.typingSpeed(number, { showDecimalPlaces: false });
  textElement.innerHTML = numberText;
  miniElement.innerHTML = numberText;
}

let state = false;

export function show(): void {
  if (Config.liveSpeedStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
  if (Config.liveSpeedStyle === "mini") {
    miniElement.classList.remove("hidden");
    animate(miniElement, {
      opacity: [0, 1],
      duration: applyReducedMotion(125),
    });
  } else {
    textElement.classList.remove("hidden");
    animate(textElement, {
      opacity: [0, 1],
      duration: applyReducedMotion(125),
    });
  }
  state = true;
}

export function hide(): void {
  if (!state) return;
  animate(miniElement, {
    opacity: [1, 0],
    duration: applyReducedMotion(125),
    onComplete: () => {
      miniElement.classList.add("hidden");
    },
  });
  animate(textElement, {
    opacity: [1, 0],
    duration: applyReducedMotion(125),
    onComplete: () => {
      textElement.classList.add("hidden");
    },
  });
  state = false;
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "liveSpeedStyle") eventValue === "off" ? hide() : show();
});
