import Config from "../config";
import * as TestInput from "./test-input";
import * as TestState from "../test/test-state";
import { subscribe } from "../observables/config-event";
import { Caret } from "../utils/caret";

export function stopAnimation(): void {
  caret.stopBlinking();
}

export function startAnimation(): void {
  caret.startBlinking();
}

export function hide(): void {
  caret.hide();
}

export function resetPosition(): void {
  caret.clearMargins();
  caret.stopAllAnimations();
  caret.goTo({
    wordIndex: 0,
    letterIndex: 0,
    isLanguageRightToLeft: TestState.isLanguageRightToLeft,
    animate: false,
  });
}

export function updatePosition(noAnim = false): void {
  caret.goTo({
    wordIndex: TestState.activeWordIndex,
    letterIndex: TestInput.input.current.length,
    isLanguageRightToLeft: TestState.isLanguageRightToLeft,
    animate: Config.smoothCaret !== "off" && !noAnim,
  });
}

export const caret = new Caret(
  document.getElementById("caret") as HTMLElement,
  Config.caretStyle
);

subscribe((eventKey) => {
  if (eventKey === "caretStyle") {
    caret.setStyle(Config.caretStyle);
    updatePosition(true);
  }
  if (eventKey === "smoothCaret") {
    caret.updateBlinkingAnimation();
  }
});

export function show(noAnim = false): void {
  caret.show();
  updatePosition(noAnim);
  startAnimation();
}
