import * as Misc from "../utils/misc";
import Config from "../config";
import * as TestInput from "./test-input";
import * as SlowTimer from "../states/slow-timer";
import * as TestActive from "../states/test-active";

export let caretAnimating = true;

export function stopAnimation(): void {
  if (caretAnimating === true) {
    $("#caret").css("animation-name", "none");
    $("#caret").css("opacity", "1");
    caretAnimating = false;
  }
}

export function startAnimation(): void {
  if (caretAnimating === false) {
    if (Config.smoothCaret && !SlowTimer.get()) {
      $("#caret").css("animation-name", "caretFlashSmooth");
    } else {
      $("#caret").css("animation-name", "caretFlashHard");
    }
    caretAnimating = true;
  }
}

export function hide(): void {
  $("#caret").addClass("hidden");
}

export async function updatePosition(): Promise<void> {
  if ($("#wordsWrapper").hasClass("hidden")) return;
  // if ($("#caret").hasClass("off")) {
  //   return;
  // }

  const caret = $("#caret");
  const caretWidth = Math.round(
    document.querySelector("#caret")?.getBoundingClientRect().width ?? 0
  );

  const fullWidthCaret = ["block", "outline", "underline"].includes(
    Config.caretStyle
  );

  const inputLen = TestInput.input.current.length;
  const currentLetterIndex = inputLen;
  //insert temporary character so the caret will work in zen mode
  const activeWordEmpty = $("#words .active").children().length == 0;
  if (activeWordEmpty) {
    $("#words .active").append('<letter style="opacity: 0;">_</letter>');
  }

  const currentWordNodeList = document
    ?.querySelector("#words .active")
    ?.querySelectorAll("letter");

  if (!currentWordNodeList) return;

  const currentLetter: HTMLElement = currentWordNodeList[
    currentLetterIndex
  ] as HTMLElement;

  const previousLetter: HTMLElement = currentWordNodeList[
    Math.min(currentLetterIndex - 1, currentWordNodeList.length - 1)
  ] as HTMLElement;

  const currentLanguage = await Misc.getCurrentLanguage(Config.language);
  const isLanguageLeftToRight = currentLanguage.leftToRight;
  const letterPosLeft =
    (currentLetter
      ? currentLetter.offsetLeft
      : previousLetter.offsetLeft + previousLetter.offsetWidth) +
    (isLanguageLeftToRight
      ? 0
      : currentLetter
      ? currentLetter.offsetWidth
      : -previousLetter.offsetWidth);

  const letterPosTop = currentLetter
    ? currentLetter.offsetTop
    : previousLetter.offsetTop;

  const newTop =
    letterPosTop - Config.fontSize * Misc.convertRemToPixels(1) * 0.1;
  let newLeft = letterPosLeft - (fullWidthCaret ? 0 : caretWidth / 2);

  const wordsWrapperWidth =
    $(<HTMLElement>document.querySelector("#wordsWrapper")).width() ?? 0;

  if (Config.tapeMode === "letter") {
    newLeft = wordsWrapperWidth / 2 - (fullWidthCaret ? 0 : caretWidth / 2);
  } else if (Config.tapeMode === "word") {
    if (inputLen == 0) {
      newLeft = wordsWrapperWidth / 2 - (fullWidthCaret ? 0 : caretWidth / 2);
    } else {
      let inputWidth = 0;
      for (let i = 0; i < inputLen; i++) {
        inputWidth += $(currentWordNodeList[i]).outerWidth(true) as number;
      }
      newLeft =
        wordsWrapperWidth / 2 +
        inputWidth -
        (fullWidthCaret ? 0 : caretWidth / 2);
    }
  }
  const newWidth = fullWidthCaret
    ? ((currentLetter
        ? currentLetter.offsetWidth
        : previousLetter.offsetWidth) ?? 0) + "px"
    : "";

  let smoothlinescroll = $("#words .smoothScroller").height();
  if (smoothlinescroll === undefined) smoothlinescroll = 0;

  caret.css("display", "block"); //for some goddamn reason adding width animation sets the display to none ????????

  const animation: { top: number; left: number; width?: string } = {
    top: newTop - smoothlinescroll,
    left: newLeft,
  };

  if (newWidth !== "") {
    animation["width"] = newWidth;
  } else {
    caret.css("width", "");
  }

  caret
    .stop(true, false)
    .animate(animation, Config.smoothCaret && !SlowTimer.get() ? 100 : 0);

  if (Config.showAllLines) {
    const browserHeight = window.innerHeight;
    const middlePos =
      browserHeight / 2 - ($("#caret").outerHeight() as number) / 2;
    const contentHeight = document.body.scrollHeight;

    if (
      newTop >= middlePos &&
      contentHeight > browserHeight &&
      TestActive.get()
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
    $("#words .active").children().remove();
  }
}

export function show(): void {
  if ($("#result").hasClass("hidden")) {
    $("#caret").removeClass("hidden");
    updatePosition();
    startAnimation();
  }
}
