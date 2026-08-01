import { Config } from "../config/store";
import { ElementWithUtils, qsr } from "../utils/dom";

const FALL_DURATION_MS = 1000;

/** clones currently falling, keyed by the index of the word they were cloned from */
const fallingClones = new Map<number, ElementWithUtils>();

export function onWordTyped(word: ElementWithUtils): void {
  switch (Config.typedEffect) {
    case "fall":
      triggerFall(word);
      return;
    default:
      return;
  }
}

/**
 * called when a word that was already typed becomes the active word again,
 * so its clone doesn't keep falling next to the word it was cloned from
 */
export function onWordUntyped(wordIndex: number): void {
  removeClone(wordIndex);
}

export function clear(): void {
  for (const clone of fallingClones.values()) {
    clone.remove();
  }
  fallingClones.clear();
}

function removeClone(wordIndex: number): void {
  const clone = fallingClones.get(wordIndex);
  if (clone === undefined) return;
  fallingClones.delete(wordIndex);
  clone.remove();
}

function triggerFall(word: ElementWithUtils): void {
  if (word.hasClass("error")) return;

  const wordIndex = parseInt(word.getAttribute("data-wordindex") ?? "", 10);
  if (Number.isNaN(wordIndex)) return;

  const rect = word.native.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  //a word can be typed again after going back to it, so make sure we only ever
  //have one clone per word
  removeClone(wordIndex);

  const clone = new ElementWithUtils(
    word.native.cloneNode(true) as HTMLElement,
  );

  // the clone has to live inside #words to inherit its letter colors, so it
  // needs to lose everything that makes the rest of the code treat it like a
  // real word (looking words up by index, joining scripts, line counting, ...)
  clone
    .removeAttribute("data-wordindex")
    .removeClass(["active", "typed"])
    .addClass("fall-clone")
    .setStyle({
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });

  qsr(".pageTest #words").append(clone);
  fallingClones.set(wordIndex, clone);

  const randomRotation = (Math.random() - 0.5) * 45;
  const randomX = (Math.random() - 0.5) * 100;

  clone.animate({
    translateX: randomX,
    translateY: window.innerHeight - rect.top,
    rotate: randomRotation,
    opacity: [1, 1, 0],
    duration: FALL_DURATION_MS,
    ease: "inQuad",
    onComplete: () => {
      if (fallingClones.get(wordIndex) === clone) {
        fallingClones.delete(wordIndex);
      }
      clone.remove();
    },
  });
}
