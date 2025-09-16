import Config from "../config";
import * as TestInput from "./test-input";
import * as TestState from "../test/test-state";
import { subscribe } from "../observables/config-event";
import { Caret } from "../utils/caret";
import * as JSONData from "../utils/json-data";

export function stopAnimation(): void {
  caret.stopBlinking();
}

export function startAnimation(): void {
  caret.startBlinking();
}

export function hide(): void {
  caret.getElement().classList.add("hidden");
}

export function getCaret(): Caret {
  return caret;
}

export async function resetPosition(): Promise<void> {
  const isLanguageRightToLeft =
    (await JSONData.getLanguage(Config.language)).rightToLeft ?? false;

  caret.clearMargins();
  caret.stopAllAnimations();
  caret.goTo({
    wordIndex: 0,
    letterIndex: 0,
    isLanguageRightToLeft,
    animate: false,
  });
}

export async function updatePosition(noAnim = false): Promise<void> {
  const isLanguageRightToLeft =
    (await JSONData.getLanguage(Config.language)).rightToLeft ?? false;

  caret.goTo({
    wordIndex: TestState.activeWordIndex,
    letterIndex: TestInput.input.current.length,
    isLanguageRightToLeft,
    animate: Config.smoothCaret !== "off" && !noAnim,
  });

  //this should probably be somewhere else, or might not even be needed?
  // if (Config.showAllLines) {
  //   const browserHeight = window.innerHeight;
  //   const middlePos = browserHeight / 2 - (jqcaret.outerHeight() as number) / 2;
  //   const contentHeight = document.body.scrollHeight;

  //   if (
  //     newTop >= middlePos &&
  //     contentHeight > browserHeight &&
  //     TestState.isActive
  //   ) {
  //     const newscrolltop = newTop - middlePos / 2;
  //     window.scrollTo({
  //       left: 0,
  //       top: newscrolltop,
  //       behavior: prefersReducedMotion() ? "instant" : "smooth",
  //     });
  //   }
  // }
}

const caret = new Caret(
  document.getElementById("caret") as HTMLElement,
  Config.caretStyle
);

subscribe((eventKey) => {
  if (eventKey === "caretStyle") {
    caret.setStyle(Config.caretStyle);
    void updatePosition(true);
  }
  if (eventKey === "smoothCaret") {
    caret.updateBlinkingAnimation();
  }
});

export function show(noAnim = false): void {
  caret.getElement().classList.remove("hidden");
  void updatePosition(noAnim);
  startAnimation();
}
