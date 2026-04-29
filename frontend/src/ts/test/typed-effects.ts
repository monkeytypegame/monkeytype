import { Config } from "../config/store";
import { ElementWithUtils, qsa } from "../utils/dom";
const FALL_DURATION_MS = 1000;

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

  const computedStyle = window.getComputedStyle(word.native);
  const clone = word.native.cloneNode(true) as HTMLElement;
  const randomRotation = (Math.random() - 0.5) * 45;
  const randomX = (Math.random() - 0.5) * 100;

  clone.classList.add("fall-clone");
  clone.style.top = `${rect.top}px`;
  clone.style.left = `${rect.left}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.fontSize = computedStyle.fontSize;
  clone.style.fontFamily = computedStyle.fontFamily;
  clone.style.color = computedStyle.color;
  clone.style.setProperty("--fall-rotation", `${randomRotation}deg`);
  clone.style.setProperty("--fall-x", `${randomX}px`);

  document.body.appendChild(clone);

  const cleanup = (): void => {
    clone.remove();
  };

  clone.addEventListener("animationend", cleanup, { once: true });
  window.setTimeout(cleanup, FALL_DURATION_MS);
}
