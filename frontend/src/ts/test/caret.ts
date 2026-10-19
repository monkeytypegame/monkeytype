import { Config } from "../config/store";
import { getCurrentInput } from "./events/data";
import {
  isDirectionReversed,
  isLanguageRightToLeft,
  getActiveWordIndex,
} from "../states/test";
import { configEvent } from "../events/config";
import { Caret } from "../elements/caret";
import * as CompositionState from "../legacy-states/composition";
import { ElementWithUtils } from "../utils/dom";

export function stopAnimation(): void {
  caret?.stopBlinking();
}

export function startAnimation(): void {
  caret?.startBlinking();
}

export function hide(): void {
  caret?.hide();
}

export function resetPosition(): void {
  caret?.stopAllAnimations();
  caret?.clearMargins();
  caret?.goTo({
    wordIndex: 0,
    letterIndex: 0,
    isLanguageRightToLeft: isLanguageRightToLeft(),
    isDirectionReversed: isDirectionReversed(),
    animate: false,
  });
}

export function updatePosition(noAnim = false): void {
  caret?.goTo({
    wordIndex: getActiveWordIndex(),
    letterIndex: getCurrentInput().length + CompositionState.getData().length,
    isLanguageRightToLeft: isLanguageRightToLeft(),
    isDirectionReversed: isDirectionReversed(),
    animate: Config.smoothCaret !== "off" && !noAnim,
  });
}

// #caret is rendered by TestPage, set via initElement() on every mount
export let caret: Caret | undefined;

export function initElement(
  refs: {
    caret: ElementWithUtils;
    words: ElementWithUtils;
    wordsWrapper: ElementWithUtils;
  },
  signal: AbortSignal,
): void {
  const created = new Caret(refs.caret, Config.caretStyle, refs);
  caret = created;
  signal.addEventListener("abort", () => {
    // a remount may have created a new caret already
    if (caret === created) caret = undefined;
  });
}

configEvent.subscribe(({ key }) => {
  if (key === "caretStyle") {
    caret?.setStyle(Config.caretStyle);
    updatePosition(true);
  }
  if (key === "smoothCaret") {
    caret?.updateBlinkingAnimation();
  }
});

export function show(noAnim = false): void {
  caret?.show();
  updatePosition(noAnim);
  startAnimation();
}
