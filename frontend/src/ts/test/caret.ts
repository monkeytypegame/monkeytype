import { createRoot } from "solid-js";
import { Config } from "../config/store";
import { createEffectOn } from "../hooks/effects";
import { getCurrentInput } from "./events/data";
import {
  isDirectionReversed,
  isLanguageRightToLeft,
  getActiveWordIndex,
  getCompositionData,
  isFocusMode,
} from "../states/test";
import { configEvent } from "../events/config";
import { Caret } from "../elements/caret";
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
    letterIndex: getCurrentInput().length + getCompositionData().length,
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

// the caret stops blinking in focus mode
createRoot(() => {
  createEffectOn(
    isFocusMode,
    (focused) => (focused ? stopAnimation() : startAnimation()),
    { defer: true },
  );
});

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
