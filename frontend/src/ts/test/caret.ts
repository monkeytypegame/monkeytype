import * as JSONData from "../utils/json-data";
import Config from "../config";
import * as TestInput from "./test-input";
import * as SlowTimer from "../states/slow-timer";
import * as TestState from "../test/test-state";
import * as TestWords from "./test-words";
import { prefersReducedMotion } from "../utils/misc";
import { convertRemToPixels } from "../utils/numbers";
import { splitIntoCharacters } from "../utils/strings";
import { safeNumber } from "@monkeytype/util/numbers";

export let caretAnimating = true;
const caret = document.querySelector("#caret") as HTMLElement;

export function stopAnimation(): void {
  if (caretAnimating) {
    caret.style.animationName = "none";
    caret.style.opacity = "1";
    caretAnimating = false;
  }
}

export function startAnimation(): void {
  if (!caretAnimating) {
    if (Config.smoothCaret !== "off" && !SlowTimer.get()) {
      caret.style.animationName = "caretFlashSmooth";
    } else {
      caret.style.animationName = "caretFlashHard";
    }
    caretAnimating = true;
  }
}

export function hide(): void {
  caret.classList.add("hidden");
}

export function getSpaceWidth(wordElement?: HTMLElement): number {
  if (!wordElement)
    wordElement = document
      .getElementById("words")
      ?.querySelectorAll(".word")?.[0] as HTMLElement | undefined;
  if (!wordElement) return 0;
  const wordComputedStyle = window.getComputedStyle(wordElement);
  return (
    parseInt(wordComputedStyle.marginRight) +
    parseInt(wordComputedStyle.marginLeft)
  );
}

function getTargetPositionLeft(
  fullWidthCaret: boolean,
  isLanguageRightToLeft: boolean,
  activeWordElement: HTMLElement,
  activeWordEmpty: boolean,
  currentWordNodeList: NodeListOf<Element>,
  fullWidthCaretWidth: number,
  wordLen: number,
  inputLen: number
): number {
  const invisibleExtraLetters = Config.blindMode || Config.hideExtraLetters;
  let result = 0;

  if (Config.tapeMode === "off") {
    let positionOffsetToWord = 0;

    const currentLetter = currentWordNodeList[inputLen] as
      | HTMLElement
      | undefined;
    const lastWordLetter = currentWordNodeList[wordLen - 1] as
      | HTMLElement
      | undefined;
    const lastInputLetter = currentWordNodeList[inputLen - 1] as
      | HTMLElement
      | undefined;

    if (isLanguageRightToLeft) {
      if (inputLen < wordLen && currentLetter) {
        positionOffsetToWord =
          currentLetter?.offsetLeft +
          (fullWidthCaret ? 0 : fullWidthCaretWidth);
      } else if (!invisibleExtraLetters) {
        positionOffsetToWord =
          (lastInputLetter?.offsetLeft ?? 0) -
          (fullWidthCaret ? fullWidthCaretWidth : 0);
      } else {
        positionOffsetToWord =
          (lastWordLetter?.offsetLeft ?? 0) -
          (fullWidthCaret ? fullWidthCaretWidth : 0);
      }
    } else {
      if (inputLen < wordLen && currentLetter) {
        positionOffsetToWord = currentLetter?.offsetLeft;
      } else if (!invisibleExtraLetters) {
        positionOffsetToWord =
          (lastInputLetter?.offsetLeft ?? 0) +
          (lastInputLetter?.offsetWidth ?? 0);
      } else {
        positionOffsetToWord =
          (lastWordLetter?.offsetLeft ?? 0) +
          (lastWordLetter?.offsetWidth ?? 0);
      }
    }
    result = activeWordElement.offsetLeft + positionOffsetToWord;
    if (activeWordEmpty && isLanguageRightToLeft)
      result += activeWordElement.offsetWidth;
  } else {
    const wordsWrapperWidth =
      $(document.querySelector("#wordsWrapper") as HTMLElement).width() ?? 0;
    const tapeMargin =
      wordsWrapperWidth *
      (isLanguageRightToLeft
        ? 1 - Config.tapeMargin / 100
        : Config.tapeMargin / 100);

    result =
      tapeMargin -
      (fullWidthCaret && isLanguageRightToLeft ? fullWidthCaretWidth : 0);

    if (Config.tapeMode === "word" && inputLen > 0) {
      let currentWordWidth = 0;
      let lastPositiveLetterWidth = 0;
      for (let i = 0; i < inputLen; i++) {
        if (invisibleExtraLetters && i >= wordLen) break;
        const letterOuterWidth =
          $(currentWordNodeList[i] as Element).outerWidth(true) ?? 0;
        currentWordWidth += letterOuterWidth;
        if (letterOuterWidth > 0) lastPositiveLetterWidth = letterOuterWidth;
      }
      // if current letter has zero width move the caret to previous positive width letter
      if ($(currentWordNodeList[inputLen] as Element).outerWidth(true) === 0)
        currentWordWidth -= lastPositiveLetterWidth;
      if (isLanguageRightToLeft) currentWordWidth *= -1;
      result += currentWordWidth;
    }
  }

  return result;
}

export async function updatePosition(noAnim = false): Promise<void> {
  const caretWidth = Math.round(
    document.querySelector("#caret")?.getBoundingClientRect().width ?? 0
  );

  const fullWidthCaret = ["block", "outline", "underline"].includes(
    Config.caretStyle
  );

  let wordLen = splitIntoCharacters(TestWords.words.getCurrent()).length;
  const inputLen = splitIntoCharacters(TestInput.input.current).length;
  if (Config.mode === "zen") wordLen = inputLen;
  const activeWordEl = document?.querySelector("#words .active") as HTMLElement;
  let activeWordEmpty = false;
  if (Config.mode === "zen") {
    wordLen = inputLen;
    if (inputLen === 0) activeWordEmpty = true;
  }

  const currentWordNodeList = activeWordEl?.querySelectorAll("letter");
  if (!currentWordNodeList?.length) return;

  const currentLetter = currentWordNodeList[inputLen] as
    | HTMLElement
    | undefined;
  const lastWordLetter = currentWordNodeList[wordLen - 1] as
    | HTMLElement
    | undefined;

  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRightToLeft = currentLanguage.rightToLeft;

  // in blind mode, and hide extra letters, extra letters have zero offsets
  // offsetHeight is the same for all visible letters
  // so is offsetTop (for same line letters)
  const letterHeight =
    (safeNumber(currentLetter?.offsetHeight) ?? 0) ||
    (safeNumber(lastWordLetter?.offsetHeight) ?? 0) ||
    Config.fontSize * convertRemToPixels(1);

  const letterPosTop =
    currentLetter?.offsetTop ?? lastWordLetter?.offsetTop ?? 0;
  const diff = letterHeight - caret.offsetHeight;
  let newTop = activeWordEl.offsetTop + letterPosTop + diff / 2;
  if (Config.caretStyle === "underline") {
    newTop = activeWordEl.offsetTop + letterPosTop - caret.offsetHeight / 2;
  }

  let letterWidth = currentLetter?.offsetWidth;
  if (letterWidth === undefined || activeWordEmpty) {
    letterWidth = getSpaceWidth(activeWordEl);
  } else if (letterWidth === 0) {
    // current letter is a zero-width character e.g, diacritics)
    letterWidth = 0;
    for (let i = inputLen; i >= 0; i--) {
      letterWidth = (currentWordNodeList[i] as HTMLElement)?.offsetWidth;
      if (letterWidth) break;
    }
  }
  const newWidth = fullWidthCaret ? (letterWidth ?? 0) + "px" : "";

  const letterPosLeft = getTargetPositionLeft(
    fullWidthCaret,
    isLanguageRightToLeft,
    activeWordEl,
    activeWordEmpty,
    currentWordNodeList,
    letterWidth,
    wordLen,
    inputLen
  );
  const newLeft = letterPosLeft - (fullWidthCaret ? 0 : caretWidth / 2);

  let smoothlinescroll = $("#words .smoothScroller").height();
  if (smoothlinescroll === undefined) smoothlinescroll = 0;

  const jqcaret = $(caret);

  jqcaret.css("display", "block"); //for some goddamn reason adding width animation sets the display to none ????????

  const animation: { top: number; left: number; width?: string } = {
    top: newTop - smoothlinescroll,
    left: newLeft,
  };

  if (newWidth !== "") {
    animation.width = newWidth;
  } else {
    jqcaret.css("width", "");
  }

  const smoothCaretSpeed =
    Config.smoothCaret === "off"
      ? 0
      : Config.smoothCaret === "slow"
      ? 150
      : Config.smoothCaret === "medium"
      ? 100
      : Config.smoothCaret === "fast"
      ? 85
      : 0;

  jqcaret
    .stop(true, false)
    .animate(animation, SlowTimer.get() || noAnim ? 0 : smoothCaretSpeed);

  if (Config.showAllLines) {
    const browserHeight = window.innerHeight;
    const middlePos = browserHeight / 2 - (jqcaret.outerHeight() as number) / 2;
    const contentHeight = document.body.scrollHeight;

    if (
      newTop >= middlePos &&
      contentHeight > browserHeight &&
      TestState.isActive
    ) {
      const newscrolltop = newTop - middlePos / 2;
      window.scrollTo({
        left: 0,
        top: newscrolltop,
        behavior: prefersReducedMotion() ? "instant" : "smooth",
      });
    }
  }
}

export function show(noAnim = false): void {
  caret.classList.remove("hidden");
  void updatePosition(noAnim);
  startAnimation();
}
