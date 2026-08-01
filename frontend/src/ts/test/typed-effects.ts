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

/**
 * position of an element relative to one of its ancestors, in the ancestors own
 * (untransformed) coordinates - unlike getBoundingClientRect this is not thrown
 * off by the funboxes that transform the whole test (mirror, upside down, nausea)
 */
function getOffsetWithin(
  element: HTMLElement,
  ancestor: HTMLElement,
): { top: number; left: number } {
  let top = 0;
  let left = 0;
  let current: HTMLElement | null = element;

  while (current !== null && current !== ancestor) {
    top += current.offsetTop;
    left += current.offsetLeft;
    current = current.offsetParent as HTMLElement | null;
  }

  return { top, left };
}

/**
 * letter colors are set by css scoped to #words, which the clone is not inside
 * of, so they have to be carried over as they are currently rendered - this also
 * keeps the clone correct in colorful mode and with flipped test colors
 */
function copyLetterColors(
  word: ElementWithUtils,
  clone: ElementWithUtils,
): void {
  const sourceLetters = word.qsa("letter");
  const cloneLetters = clone.qsa("letter");

  for (let i = 0; i < cloneLetters.length; i++) {
    const source = sourceLetters[i];
    const target = cloneLetters[i];
    if (source === undefined || target === undefined) break;

    const { color, borderBottom } = window.getComputedStyle(source.native);
    target.setStyle({ color, borderBottom });
  }
}

function triggerFall(word: ElementWithUtils): void {
  if (word.hasClass("error")) return;

  const wordIndex = parseInt(word.getAttribute("data-wordindex") ?? "", 10);
  if (Number.isNaN(wordIndex)) return;

  const { offsetWidth, offsetHeight } = word.native;
  if (offsetWidth === 0 && offsetHeight === 0) return;

  //a word can be typed again after going back to it, so make sure we only ever
  //have one clone per word
  removeClone(wordIndex);

  //the clone lives in #typingTest instead of #words because #wordsWrapper clips
  //everything below the last line, and because #words is where the rest of the
  //code looks for words
  const container = qsr("#typingTest");
  const { top, left } = getOffsetWithin(word.native, container.native);

  const clone = new ElementWithUtils(
    word.native.cloneNode(true) as HTMLElement,
  );

  //nothing should ever be able to mistake the clone for a real word
  clone
    .removeAttribute("data-wordindex")
    .removeClass(["active", "typed"])
    .addClass("fall-clone")
    .setStyle({
      top: `${top}px`,
      left: `${left}px`,
    });
  copyLetterColors(word, clone);

  container.append(clone);
  fallingClones.set(wordIndex, clone);

  const randomRotation = (Math.random() - 0.5) * 45;
  const randomX = (Math.random() - 0.5) * 100;

  clone.animate({
    translateX: randomX,
    translateY: window.innerHeight,
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
