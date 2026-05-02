import { animate } from "animejs"; // v4: named export, no default
import { Config } from "../config/store";
import { ElementWithUtils, qsa, qsr } from "../utils/dom";

const FALL_DURATION_MS = 1700;

export function onWordTyped(word: ElementWithUtils): void {
  switch (Config.typedEffect) {
    case "fall":
      triggerFall(word);
      return;
    default:
      return;
  }
}

export function clear(): void {
  qsa(".fall-clone").remove();
}

function triggerFall(word: ElementWithUtils): void {
  if (word.hasClass("error")) return;

  const rect = word.native.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  const clone = word.native.cloneNode(true) as HTMLElement;

  clone.classList.remove("active");
  clone.classList.add("fall-clone");
  clone.style.top = `${rect.top}px`;
  clone.style.left = `${rect.left}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;

  qsr("#words").native.appendChild(clone);

  const randomRotation = (Math.random() - 0.5) * 45;
  const randomX = (Math.random() - 0.5) * 100;

  animate(clone, {
    translateX: randomX,
    translateY: window.innerHeight - rect.top,
    rotate: randomRotation,
    opacity: [1, 1, 0],
    duration: FALL_DURATION_MS,
    easing: "easeInQuad",
    onComplete: () => clone.remove(),
  });
}
