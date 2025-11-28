import { animate, JSAnimation } from "animejs";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";

const element = document.querySelector("#backgroundLoader") as HTMLElement;
let showAnim: JSAnimation | null = null;

export function show(instant = false): void {
  requestDebouncedAnimationFrame("loader.show", () => {
    showAnim = animate(element, {
      opacity: 1,
      duration: 125,
      delay: instant ? 0 : 125,
      onBegin: () => {
        element.classList.remove("hidden");
      },
    });
  });
}

export function hide(): void {
  requestDebouncedAnimationFrame("loader.hide", () => {
    showAnim?.pause();
    animate(element, {
      opacity: 0,
      duration: 125,
      onComplete: () => {
        element.classList.add("hidden");
      },
    });
  });
}
