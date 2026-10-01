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
import { qsr } from "../utils/dom";

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
  caret.stopAllAnimations();
  caret.clearMargins();
  caret.goTo({
    wordIndex: 0,
    letterIndex: 0,
    isLanguageRightToLeft: isLanguageRightToLeft(),
    isDirectionReversed: isDirectionReversed(),
    animate: false,
  });
}

export function updatePosition(noAnim = false): void {
  caret.goTo({
    wordIndex: getActiveWordIndex(),
    letterIndex: getCurrentInput().length + CompositionState.getData().length,
    isLanguageRightToLeft: isLanguageRightToLeft(),
    isDirectionReversed: isDirectionReversed(),
    animate: Config.smoothCaret !== "off" && !noAnim,
  });
}

export const caret = new Caret(qsr("#caret"), Config.caretStyle);

configEvent.subscribe(({ key }) => {
  if (key === "caretStyle") {
    caret.setStyle(Config.caretStyle);
    updatePosition(true);
  }
  if (key === "smoothCaret") {
    caret.updateBlinkingAnimation();
  }
});

export function show(noAnim = false): void {
  caret.show();
  updatePosition(noAnim);
  startAnimation();
}
