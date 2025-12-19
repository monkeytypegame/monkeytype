import { JSAnimation } from "animejs";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { qsr } from "../utils/dom";

const element = qsr("#backgroundLoader");
let showAnim: JSAnimation | null = null;

export function show(instant = false): void {
  requestDebouncedAnimationFrame("loader.show", () => {
    showAnim = element.animate({
      opacity: 1,
      duration: 125,
      delay: instant ? 0 : 125,
      onBegin: () => {
        element.removeClass("hidden");
      },
    });
  });
}

export function hide(): void {
  requestDebouncedAnimationFrame("loader.hide", () => {
    showAnim?.pause();
    element.animate({
      opacity: 0,
      duration: 125,
      onComplete: () => {
        element.addClass("hidden");
      },
    });
  });
}
