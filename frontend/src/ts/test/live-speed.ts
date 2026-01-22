import Config from "../config";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";
import Format from "../utils/format";
import { applyReducedMotion } from "../utils/misc";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { qs } from "../utils/dom";

const textElement = qs("#liveStatsTextBottom .liveSpeed");
const miniElement = qs("#liveStatsMini .speed");

export function reset(): void {
  requestDebouncedAnimationFrame("live-speed.reset", () => {
    textElement?.setHtml("0");
    miniElement?.setHtml("0");
  });
}

export function update(wpm: number, raw: number): void {
  requestDebouncedAnimationFrame("live-speed.update", () => {
    let number = wpm;
    if (Config.blindMode) {
      number = raw;
    }
    const numberText = Format.typingSpeed(number, { showDecimalPlaces: false });
    textElement?.setHtml(numberText);
    miniElement?.setHtml(numberText);
  });
}

let state = false;

export function show(): void {
  if (Config.liveSpeedStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
  requestDebouncedAnimationFrame("live-speed.show", () => {
    if (Config.liveSpeedStyle === "mini") {
      miniElement?.show();
      miniElement?.animate({
        opacity: [0, 1],
        duration: applyReducedMotion(125),
      });
    } else {
      textElement?.show();
      textElement?.animate({
        opacity: [0, 1],
        duration: applyReducedMotion(125),
      });
    }
    state = true;
  });
}

export function hide(): void {
  if (!state) return;
  requestDebouncedAnimationFrame("live-speed.hide", () => {
    miniElement?.animate({
      opacity: [1, 0],
      duration: applyReducedMotion(125),
      onComplete: () => {
        miniElement?.hide();
      },
    });
    textElement?.animate({
      opacity: [1, 0],
      duration: applyReducedMotion(125),
      onComplete: () => {
        textElement?.hide();
      },
    });
    state = false;
  });
}

export function instantHide(): void {
  if (!state) return;
  miniElement?.hide();
  miniElement?.setStyle({ opacity: "0" });
  textElement?.hide();
  textElement?.setStyle({ opacity: "0" });
  state = false;
}

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "liveSpeedStyle") newValue === "off" ? hide() : show();
});
