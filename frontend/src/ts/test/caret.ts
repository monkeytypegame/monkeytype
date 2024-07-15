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

function getTargetPositionLeft(
  fullWidthCaret: boolean,
  isLanguageRightToLeft: boolean,
  currentLetter: HTMLElement | undefined,
  previousLetter: HTMLElement | undefined,
  lastWordLetter: HTMLElement,
  inputLenLongerThanWordLen: boolean
): number {
  let result = 0;

  if (isLanguageRightToLeft) {
    const fullWidthOffset = fullWidthCaret
      ? 0
      : currentLetter?.offsetWidth ?? previousLetter?.offsetWidth ?? 0;
    if (currentLetter !== undefined) {
      result = currentLetter.offsetLeft + fullWidthOffset;
    } else if (previousLetter !== undefined) {
      result =
        previousLetter.offsetLeft -
        previousLetter.offsetWidth +
        fullWidthOffset;
    }
  } else {
    if (Config.blindMode && inputLenLongerThanWordLen) {
      result = lastWordLetter.offsetLeft + lastWordLetter.offsetWidth;
    } else if (currentLetter !== undefined) {
      result = currentLetter.offsetLeft;
    } else if (previousLetter !== undefined) {
      result = previousLetter.offsetLeft + previousLetter.offsetWidth;
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

  const currentWordNodeList = document
    ?.querySelector("#words .active")
    ?.querySelectorAll("letter");

  if (!currentWordNodeList) return;

  const currentLetter = currentWordNodeList[inputLen] as
    | HTMLElement
    | undefined;

  const previousLetter: HTMLElement = currentWordNodeList[
    inputLen - 1
  ] as HTMLElement;

  const lastWordLetter = currentWordNodeList[wordLen - 1] as HTMLElement;

  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRightToLeft = currentLanguage.rightToLeft;
  const letterPosLeft = getTargetPositionLeft(
    fullWidthCaret,
    isLanguageRightToLeft,
    currentLetter,
    previousLetter,
    lastWordLetter,
    inputLen > wordLen
  );

  const letterPosTop =
    currentLetter?.offsetTop ??
    previousLetter?.offsetTop ??
    lastWordLetter?.offsetTop;

  const letterHeight =
    currentLetter?.offsetHeight ||
    previousLetter?.offsetHeight ||
    lastWordLetter?.offsetHeight ||
    Config.fontSize * Numbers.convertRemToPixels(1);

  const letterWidth =
    currentLetter?.offsetWidth ??
    previousLetter?.offsetWidth ??
    lastWordLetter?.offsetWidth;

  const diff = letterHeight - caret.offsetHeight;

  let newTop = activeWordEl.offsetTop + letterPosTop + diff / 2;

  if (Config.caretStyle === "underline") {
    newTop = activeWordEl.offsetTop + letterPosTop - caret.offsetHeight / 2;
  }

  let newLeft =
    activeWordEl.offsetLeft +
    letterPosLeft -
    (fullWidthCaret ? 0 : caretWidth / 2);

  const wordsWrapperWidth =
    $(document.querySelector("#wordsWrapper") as HTMLElement).width() ?? 0;

  if (Config.tapeMode === "letter") {
    newLeft = wordsWrapperWidth / 2 - (fullWidthCaret ? 0 : caretWidth / 2);
  } else if (Config.tapeMode === "word") {
    if (inputLen === 0) {
      newLeft = wordsWrapperWidth / 2 - (fullWidthCaret ? 0 : caretWidth / 2);
    } else {
      let inputWidth = 0;
      for (let i = 0; i < inputLen; i++) {
        inputWidth += $(currentWordNodeList[i] as HTMLElement).outerWidth(
          true
        ) as number;
      }
      newLeft =
        wordsWrapperWidth / 2 +
        inputWidth -
        (fullWidthCaret ? 0 : caretWidth / 2);
    }
  }
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
