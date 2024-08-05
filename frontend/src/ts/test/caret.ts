import * as Numbers from "../utils/numbers";
import * as JSONData from "../utils/json-data";
import Config from "../config";
import * as TestInput from "./test-input";
import * as SlowTimer from "../states/slow-timer";
import * as TestState from "../test/test-state";
import * as TestWords from "./test-words";

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
  currentWordNodeList: NodeListOf<Element>,
  spaceWidth: number,
  wordLen: number,
  inputLen: number
): number {
  let result = 0;

  const currentLetter = currentWordNodeList[inputLen] as
    | HTMLElement
    | undefined;
  const lastWordLetter = currentWordNodeList[wordLen - 1] as HTMLElement;
  const lastInputLetter = currentWordNodeList[inputLen - 1] as
    | HTMLElement
    | undefined;

  if (isLanguageRightToLeft) {
    let positiveLetterWidth = 0;
    for (let i = inputLen; i >= 0; i--) {
      const letter = currentWordNodeList[i] as HTMLElement;
      if ((positiveLetterWidth = letter?.offsetWidth ?? 0)) break;
    }

    if (inputLen < wordLen && currentLetter) {
      result =
        currentLetter.offsetLeft + (fullWidthCaret ? 0 : positiveLetterWidth);
    } else if (Config.blindMode || Config.hideExtraLetters) {
      result = lastWordLetter.offsetLeft - (fullWidthCaret ? spaceWidth : 0);
    } else {
      result =
        (lastInputLetter?.offsetLeft ?? lastWordLetter.offsetLeft) -
        (fullWidthCaret ? spaceWidth : 0);
    }
  } else {
    if (inputLen < wordLen && currentLetter) {
      result = currentLetter.offsetLeft;
    } else if (Config.blindMode || Config.hideExtraLetters) {
      result = lastWordLetter.offsetLeft + lastWordLetter.offsetWidth;
    } else {
      result =
        (lastInputLetter?.offsetLeft ?? lastWordLetter.offsetLeft) +
        (lastInputLetter?.offsetWidth ?? lastWordLetter.offsetWidth);
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

  const wordLen = TestWords.words.getCurrent().length;
  const inputLen = TestInput.input.current.length;
  const activeWordEl = document?.querySelector("#words .active") as HTMLElement;
  //insert temporary character so the caret will work in zen mode
  const activeWordEmpty = activeWordEl?.children.length === 0;
  if (activeWordEmpty) {
    activeWordEl.insertAdjacentHTML(
      "beforeend",
      '<letter style="opacity: 0;">_</letter>'
    );
  }

  const currentWordNodeList = activeWordEl?.querySelectorAll("letter");
  if (!currentWordNodeList?.length) return;

  const currentLetter = currentWordNodeList[inputLen] as
    | HTMLElement
    | undefined;
  const previousLetter = currentWordNodeList[inputLen - 1] as HTMLElement;
  const lastWordLetter = currentWordNodeList[wordLen - 1] as HTMLElement;

  const spaceWidth = getSpaceWidth(activeWordEl);

  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRightToLeft = currentLanguage.rightToLeft;

  const letterPosLeft = getTargetPositionLeft(
    fullWidthCaret,
    isLanguageRightToLeft,
    currentWordNodeList,
    spaceWidth,
    wordLen,
    inputLen
  );

  let letterPosTop =
    currentLetter?.offsetTop ??
    previousLetter?.offsetTop ??
    lastWordLetter?.offsetTop;
  // in blind mode extra letters have zero dimensions,
  // but in hide extra letters they are undefined
  if (Config.blindMode && inputLen > wordLen)
    letterPosTop = lastWordLetter?.offsetTop;

  const letterHeight =
    currentLetter?.offsetHeight ||
    previousLetter?.offsetHeight ||
    lastWordLetter?.offsetHeight ||
    Config.fontSize * Numbers.convertRemToPixels(1);

  let letterWidth = currentLetter?.offsetWidth || spaceWidth;
  if (
    currentLetter?.offsetWidth === 0 &&
    !(Config.blindMode && inputLen > wordLen)
  ) {
    // other than in extra letters in blind mode, it could be zero
    // if current letter is a zero-wwidth character e.g, diacritics)
    letterWidth = 0;
    for (let i = inputLen; i >= 0; i--) {
      letterWidth = (currentWordNodeList[i] as HTMLElement)?.offsetWidth;
      if (letterWidth) break;
    }
  }

  const diff = letterHeight - caret.offsetHeight;

  let newTop = activeWordEl.offsetTop + letterPosTop + diff / 2;

  if (Config.caretStyle === "underline") {
    newTop = activeWordEl.offsetTop + letterPosTop - caret.offsetHeight / 2;
  }

  let newLeftBeforeLineCaret = activeWordEl.offsetLeft + letterPosLeft;

  const wordsWrapperWidth =
    $(document.querySelector("#wordsWrapper") as HTMLElement).width() ?? 0;

  if (Config.tapeMode !== "off") {
    newLeftBeforeLineCaret =
      wordsWrapperWidth / 2 -
      (fullWidthCaret && isLanguageRightToLeft ? letterWidth : 0);

    if (Config.tapeMode === "word" && inputLen > 0) {
      const letters = activeWordEl?.querySelectorAll("letter");
      if (letters?.length) {
        let currentWordWidth = 0;
        for (let i = 0; i < inputLen; i++) {
          const letter = letters[i] as HTMLElement;
          if (Config.blindMode && letter.classList.contains("extra")) continue;
          currentWordWidth += $(letter).outerWidth(true) ?? 0;
        }
        if (isLanguageRightToLeft) currentWordWidth *= -1;
        newLeftBeforeLineCaret += currentWordWidth;
      }
    }
  }

  const newLeft =
    newLeftBeforeLineCaret - (fullWidthCaret ? 0 : caretWidth / 2);

  const newWidth = fullWidthCaret ? (letterWidth ?? 0) + "px" : "";

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
    Config.smoothCaret == "off"
      ? 0
      : Config.smoothCaret == "slow"
      ? 150
      : Config.smoothCaret == "medium"
      ? 100
      : Config.smoothCaret == "fast"
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
        behavior: "smooth",
      });
    }
  }
  if (activeWordEmpty) {
    activeWordEl?.replaceChildren();
  }
}

export function show(noAnim = false): void {
  caret.classList.remove("hidden");
  void updatePosition(noAnim);
  startAnimation();
}
