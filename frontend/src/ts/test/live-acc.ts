import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import { applyReducedMotion } from "../utils/misc";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { qs } from "../utils/dom";

const textEl = qs("#liveStatsTextBottom .liveAcc");
const miniEl = qs("#liveStatsMini .acc");

export function update(acc: number): void {
  requestDebouncedAnimationFrame("live-acc.update", () => {
    let number = Math.floor(acc);
    if (Config.blindMode) {
      number = 100;
    }
    miniEl?.setHtml(number + "%");
    textEl?.setHtml(number + "%");
  });
}

export function reset(): void {
  requestDebouncedAnimationFrame("live-acc.reset", () => {
    miniEl?.setHtml("100%");
    textEl?.setHtml("100%");
  });
}

let state = false;

export function show(): void {
  if (Config.liveAccStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
  requestDebouncedAnimationFrame("live-acc.show", () => {
    if (Config.liveAccStyle === "mini") {
      miniEl?.show();
      miniEl?.animate({
        opacity: [0, 1],
        duration: applyReducedMotion(125),
      });
    } else {
      textEl?.show();
      textEl?.animate({
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
    textEl?.animate({
      opacity: [1, 0],
      duration: applyReducedMotion(125),
      onComplete: () => {
        textEl?.hide();
      },
    });
    miniEl?.animate({
      opacity: [1, 0],
      duration: applyReducedMotion(125),
      onComplete: () => {
        miniEl?.hide();
      },
    });
    state = false;
  });
}

export function instantHide(): void {
  if (!state) return;

  textEl?.hide();
  textEl?.setStyle({ opacity: "0" });
  miniEl?.hide();
  miniEl?.setStyle({ opacity: "0" });

  state = false;
}

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key === "liveAccStyle") newValue === "off" ? hide() : show();
});
