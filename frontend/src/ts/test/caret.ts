import { Config } from "../config/store";
import * as TestInput from "./test-input";
import * as TestState from "../test/test-state";
import { configEvent } from "../events/config";
import { Caret } from "../elements/caret";
import * as CompositionState from "../legacy-states/composition";
import { qsr } from "../utils/dom";
import {
  getWordDirection,
  reverseDirection,
  splitIntoCharacters,
  type Direction,
} from "../utils/strings";

let testDirection: Direction;

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
    testDirection,
    zenWordDirection: Config.mode === "zen" ? testDirection : undefined,
    animate: false,
  });
}

export function init(): void {
  const langDirection = TestState.isLanguageRightToLeft ? "rtl" : "ltr";
  testDirection = TestState.isDirectionReversed
    ? reverseDirection(langDirection)
    : langDirection;
}

export function updatePosition(noAnim = false): void {
  const inputWord = splitIntoCharacters(
    TestInput.input.current + CompositionState.getData(),
  );
  const inputWordLength = inputWord.length;

  const zenWordDirection =
    Config.mode === "zen"
      ? getWordDirection(inputWord[inputWordLength - 1], testDirection)
      : undefined;

  caret.goTo({
    wordIndex: TestState.activeWordIndex,
    letterIndex: inputWordLength,
    testDirection,
    zenWordDirection,
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
