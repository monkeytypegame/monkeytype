import * as JSONData from "../utils/json-data";
import Config from "../config";
import * as TestInput from "./test-input";
import * as SlowTimer from "../states/slow-timer";
import * as TestState from "../test/test-state";
import * as TestWords from "./test-words";
import { prefersReducedMotion, sleep } from "../utils/misc";
import { convertRemToPixels } from "../utils/numbers";
import { splitIntoCharacters } from "../utils/strings";
import { safeNumber } from "@monkeytype/util/numbers";
import { subscribe } from "../observables/config-event";
import { Caret, getTargetPositionLeft, isCaretFullWidth } from "../utils/caret";

export let caretAnimating = true;
// const caret = document.querySelector("#caret") as HTMLElement;

export function stopAnimation(): void {
  // if (caretAnimating) {
  //   caret.style.animationName = "none";
  //   caret.style.opacity = "1";
  //   caretAnimating = false;
  // }
  caret.stopBlinking();
}

export function startAnimation(): void {
  // if (!caretAnimating) {
  //   if (Config.smoothCaret !== "off" && !SlowTimer.get()) {
  //     caret.style.animationName = "caretFlashSmooth";
  //   } else {
  //     caret.style.animationName = "caretFlashHard";
  //   }
  //   caretAnimating = true;
  // }
  caret.startBlinking();
}

export function hide(): void {
  caret.getElement().classList.add("hidden");
}

function getSpaceWidth(wordElement?: HTMLElement): number {
  if (!wordElement) {
    const el = document.querySelector<HTMLElement>("#words .word");
    if (el) {
      wordElement = el;
    } else {
      return 0;
    }
  }
  const wordComputedStyle = window.getComputedStyle(wordElement);
  return (
    parseInt(wordComputedStyle.marginRight) +
    parseInt(wordComputedStyle.marginLeft)
  );
}

function getLetterWidth(
  currentLetter: HTMLElement | undefined,
  activeWordEl: HTMLElement,
  wordLength: number,
  inputLength: number,
  currentWordNodeList: NodeListOf<HTMLElement>
): number {
  let letterWidth = currentLetter?.offsetWidth;
  if (letterWidth === undefined || wordLength === 0) {
    // at word beginning in zen mode current letter is defined "_" but wordLen is 0
    letterWidth = getSpaceWidth(activeWordEl);
  } else if (letterWidth === 0) {
    // current letter is a zero-width character e.g, diacritics)
    for (let i = inputLength; i >= 0; i--) {
      letterWidth = (currentWordNodeList[i] as HTMLElement)?.offsetWidth;
      if (letterWidth) break;
    }
  }
  return letterWidth ?? 0;
}

export async function updatePosition(noAnim = false): Promise<void> {
  // const caretComputedStyle = window.getComputedStyle(caret);
  // const caretWidth = parseInt(caretComputedStyle.width) || 0;
  // const caretHeight = parseInt(caretComputedStyle.height) || 0;

  // let wordLen = splitIntoCharacters(TestWords.words.getCurrent()).length;
  // const inputLen = splitIntoCharacters(TestInput.input.current).length;
  // if (Config.mode === "zen") wordLen = inputLen;
  // const activeWordEl = document.querySelector<HTMLElement>(
  //   `#words .word[data-wordindex='${TestState.activeWordIndex}']`
  // );
  // if (!activeWordEl) return;

  // const currentWordNodeList =
  //   activeWordEl.querySelectorAll<HTMLElement>("letter");
  // if (!currentWordNodeList?.length) return;

  // const currentLetter = currentWordNodeList[inputLen];
  // const lastInputLetter = currentWordNodeList[inputLen - 1];
  // const lastWordLetter = currentWordNodeList[wordLen - 1];

  // const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  // const isLanguageRightToLeft = currentLanguage.rightToLeft ?? false;

  // // in blind mode, and hide extra letters, extra letters have zero offsets
  // // offsetHeight is the same for all visible letters
  // // so is offsetTop (for same line letters)
  // const letterHeight =
  //   (safeNumber(currentLetter?.offsetHeight) ?? 0) ||
  //   (safeNumber(lastInputLetter?.offsetHeight) ?? 0) ||
  //   (safeNumber(lastWordLetter?.offsetHeight) ?? 0) ||
  //   Config.fontSize * convertRemToPixels(1);

  // const letterPosTop =
  //   currentLetter?.offsetTop ??
  //   lastInputLetter?.offsetTop ??
  //   lastWordLetter?.offsetTop ??
  //   0;
  // const diff = letterHeight - caretHeight;
  // let newTop = activeWordEl.offsetTop + letterPosTop + diff / 2;
  // if (Config.caretStyle === "underline") {
  //   newTop = activeWordEl.offsetTop + letterPosTop - caretHeight / 2;
  // }

  // const letterWidth = getLetterWidth(
  //   currentLetter,
  //   activeWordEl,
  //   wordLen,
  //   inputLen,
  //   currentWordNodeList
  // );

  // // in zen mode, use the input content to determine word direction
  // const currentWordForDirection =
  //   Config.mode === "zen"
  //     ? TestInput.input.current
  //     : TestWords.words.getCurrent();

  // const fullWidthCaret = isCaretFullWidth();

  // const letterPosLeft = getTargetPositionLeft(
  //   fullWidthCaret,
  //   isLanguageRightToLeft,
  //   activeWordEl,
  //   currentWordNodeList,
  //   letterWidth,
  //   wordLen,
  //   inputLen,
  //   currentWordForDirection
  // );
  // const newLeft = letterPosLeft - (fullWidthCaret ? 0 : caretWidth / 2);

  // const jqcaret = $(caret);

  // jqcaret.css("display", "block"); //for some goddamn reason adding width animation sets the display to none ????????

  // const animation: { top: number; left: number; width?: string } = {
  //   top: newTop - TestState.lineScrollDistance,
  //   left: newLeft,
  // };

  // if (fullWidthCaret) {
  //   animation.width = `${letterWidth}px`;
  // }

  // const smoothCaretSpeed =
  //   Config.smoothCaret === "off"
  //     ? 0
  //     : Config.smoothCaret === "slow"
  //     ? 150
  //     : Config.smoothCaret === "medium"
  //     ? 100
  //     : Config.smoothCaret === "fast"
  //     ? 85
  //     : 0;

  // jqcaret
  //   .stop(true, false)
  //   .animate(animation, SlowTimer.get() || noAnim ? 0 : smoothCaretSpeed);

  await caret.goTo({
    wordIndex: TestState.activeWordIndex,
    letterIndex: TestInput.input.current.length,
    animate: Config.smoothCaret !== "off",
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

// function updateStyle(): void {
//   caret.style.width = "";
//   caret.classList.remove(
//     ...["off", "default", "underline", "outline", "block", "carrot", "banana"]
//   );
//   caret.classList.add(Config.caretStyle);
// }

const caret = new Caret(
  document.getElementById("caret") as HTMLElement,
  Config.caretStyle
);

subscribe((eventKey) => {
  if (eventKey === "caretStyle") {
    // updateStyle();
    caret.setStyle(Config.caretStyle);
    void updatePosition(true);
  }
  if (eventKey === "smoothCaret") {
    // if (Config.smoothCaret === "off") {
    //   caret.style.animationName = "caretFlashHard";
    // } else {
    //   caret.style.animationName = "caretFlashSmooth";
    // }
  }
});

export function show(noAnim = false): void {
  caret.getElement().classList.remove("hidden");
  void updatePosition(noAnim);
  startAnimation();
}
