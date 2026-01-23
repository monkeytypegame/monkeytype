import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import Format from "../utils/format";
import { applyReducedMotion } from "../utils/misc";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { qs } from "../utils/dom";

const textEl = qs("#liveStatsTextBottom .liveBurst");
const miniEl = qs("#liveStatsMini .burst");

export function reset(): void {
  requestDebouncedAnimationFrame("live-burst.reset", () => {
    textEl?.setHtml("0");
    miniEl?.setHtml("0");
  });
}

export async function update(burst: number): Promise<void> {
  requestDebouncedAnimationFrame("live-burst.update", () => {
    const burstText = Format.typingSpeed(burst, { showDecimalPlaces: false });
    miniEl?.setHtml(burstText);
    textEl?.setHtml(burstText);
  });
}

let state = false;

export function show(): void {
  if (Config.liveBurstStyle === "off") return;
  if (!TestState.isActive) return;
  if (state) return;
  requestDebouncedAnimationFrame("live-burst.show", () => {
    if (Config.liveBurstStyle === "mini") {
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
  requestDebouncedAnimationFrame("live-burst.hide", () => {
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
  if (key === "liveBurstStyle") newValue === "off" ? hide() : show();
});
