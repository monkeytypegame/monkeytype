import { Config } from "../config/store";
import { ElementWithUtils, qsa, qsr } from "../utils/dom";

const wordsEl = qsr(".pageTest #words");

export function onWordTyped(word: ElementWithUtils): void {
  switch (Config.typedEffect) {
    case "tumble":
      triggerTumble(word);
      return;
    default:
      return;
  }
}

export function clear(): void {
  qsa(".tumble-clone").remove();
  wordsEl.qsa(".word").setStyle({ opacity: "" });
}

function triggerTumble(word: ElementWithUtils): void {
  if (word.hasClass("error")) return;

  const rect = word.native.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  const computedStyle = window.getComputedStyle(word.native);
  const clone = word.native.cloneNode(true) as HTMLElement;
  const randomRotation = (Math.random() - 0.5) * 45;
  const randomX = (Math.random() - 0.5) * 100;

  clone.classList.add("tumble-clone");
  clone.style.position = "fixed";
  clone.style.top = `${rect.top}px`;
  clone.style.left = `${rect.left}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.fontSize = computedStyle.fontSize;
  clone.style.fontFamily = computedStyle.fontFamily;
  clone.style.color = computedStyle.color;
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "1000";
  clone.style.setProperty("--fall-rotation", `${randomRotation}deg`);
  clone.style.setProperty("--fall-x", `${randomX}px`);

  document.body.appendChild(clone);
  word.setStyle({ opacity: "0" });

  clone.addEventListener("animationend", () => {
    clone.remove();
  });
}
