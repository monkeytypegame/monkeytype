import { Config } from "../config/store";
import { ElementWithUtils, qsa, qsr } from "../utils/dom";

const FALL_DURATION_MS = 1000;
const FALL_MAX_ROTATION = 45;
const FALL_MAX_DRIFT = 100;

export function onWordTyped(word: ElementWithUtils): void {
  if (Config.typedEffect === "fall") triggerFall(word);
}

export function onWordUntyped(wordIndex: number): void {
  qsa(`.fall-clone[data-fall-index="${wordIndex}"]`).remove();
}

export function clear(): void {
  qsa(".fall-clone").remove();
}

function triggerFall(word: ElementWithUtils): void {
  if (word.hasClass("error")) return;
  if (word.native.offsetWidth === 0 && word.native.offsetHeight === 0) return;

  const wordIndex = parseInt(word.getAttribute("data-wordindex") ?? "", 10);
  if (Number.isNaN(wordIndex)) return;

  // the word may still have a clone from before it was gone back to
  onWordUntyped(wordIndex);

  // not #words: #wordsWrapper clips below the last line, and words are looked
  // up by index in #words
  const container = qsr("#typingTest");
  const { top, left } = getOffsetWithin(word.native, container.native);

  const clone = new ElementWithUtils(
    word.native.cloneNode(true) as HTMLElement,
  );

  // nothing should be able to mistake the clone for a real word
  clone
    .removeAttribute("data-wordindex")
    .removeClass(["active", "typed"])
    .addClass("fall-clone")
    .setAttribute("data-fall-index", `${wordIndex}`)
    .setStyle({ top: `${top}px`, left: `${left}px` });
  copyRenderedStyles(word, clone);

  container.append(clone);

  clone.animate({
    translateX: (Math.random() - 0.5) * FALL_MAX_DRIFT,
    translateY: window.innerHeight,
    rotate: (Math.random() - 0.5) * FALL_MAX_ROTATION,
    opacity: [1, 1, 0],
    duration: FALL_DURATION_MS,
    ease: "inQuad",
    onComplete: () => clone.remove(),
  });
}

/** unlike getBoundingClientRect, not thrown off by the transform funboxes */
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

/** the clone is outside #words, so styles scoped to it have to be carried over */
function copyRenderedStyles(
  word: ElementWithUtils,
  clone: ElementWithUtils,
): void {
  const { direction, unicodeBidi } = window.getComputedStyle(word.native);
  clone.setStyle({ direction, unicodeBidi });

  const sourceLetters = word.qsa("letter");
  const cloneLetters = clone.qsa("letter");

  for (let i = 0; i < cloneLetters.length; i++) {
    const source = sourceLetters[i];
    const target = cloneLetters[i];
    if (source === undefined || target === undefined) break;

    const { color, borderBottom, display } = window.getComputedStyle(
      source.native,
    );
    target.setStyle({ color, borderBottom, display });
  }
}
