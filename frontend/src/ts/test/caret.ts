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
  let caretWidth = Math.round(
    document.querySelector("#caret")?.getBoundingClientRect().width ?? 0
  );

  if (["block", "outline", "underline"].includes(Config.caretStyle)) {
    caretWidth /= 3;
  }

  let inputLen = TestInput.input.current.length;
  inputLen = Misc.trailingComposeChars.test(TestInput.input.current)
    ? TestInput.input.current.search(Misc.trailingComposeChars) + 1
    : inputLen;
  let currentLetterIndex = inputLen - 1;
  if (currentLetterIndex == -1) {
    currentLetterIndex = 0;
  }
  //insert temporary character so the caret will work in zen mode
  const activeWordEmpty = $("#words .active").children().length == 0;
  if (activeWordEmpty) {
    $("#words .active").append('<letter style="opacity: 0;">_</letter>');
  }

  const currentWordNodeList = document
    ?.querySelector("#words .active")
    ?.querySelectorAll("letter");

  if (!currentWordNodeList) return;

  let currentLetter: HTMLElement = currentWordNodeList[
    currentLetterIndex
  ] as HTMLElement;
  if (inputLen > currentWordNodeList.length) {
    currentLetter = currentWordNodeList[
      currentWordNodeList.length - 1
    ] as HTMLElement;
  }

  if (Config.mode != "zen" && $(currentLetter).length == 0) return;
  const currentLanguage = await Misc.getCurrentLanguage(Config.language);
  const isLanguageLeftToRight = currentLanguage.leftToRight;
  const currentLetterPosLeft = isLanguageLeftToRight
    ? currentLetter.offsetLeft
    : currentLetter.offsetLeft + ($(currentLetter).width() ?? 0);
  const currentLetterPosTop = currentLetter.offsetTop;
  const letterHeight = $(currentLetter).height() as number;
  let newTop = 0;
  let newLeft = 0;

  newTop = currentLetterPosTop - Math.round(letterHeight / 5);

  if (Config.tapeMode === "letter") {
    newLeft =
      ($(<HTMLElement>document.querySelector("#wordsWrapper")).width() ?? 0) /
        2 -
      caretWidth / 2;
  } else if (Config.tapeMode === "word") {
    if (inputLen == 0) {
      newLeft =
        ($(<HTMLElement>document.querySelector("#wordsWrapper")).width() ?? 0) /
          2 -
        caretWidth / 2;
    } else {
      let inputWidth = 0;
      for (let i = 0; i < inputLen; i++) {
        inputWidth += $(currentWordNodeList[i]).outerWidth(true) as number;
      }
      newLeft =
        ($(<HTMLElement>document.querySelector("#wordsWrapper")).width() ?? 0) /
          2 +
        inputWidth -
        caretWidth / 2;
    }
  } else {
    if (inputLen == 0) {
      newLeft = isLanguageLeftToRight
        ? currentLetterPosLeft - caretWidth / 2
        : currentLetterPosLeft + caretWidth / 2;
    } else {
      newLeft = isLanguageLeftToRight
        ? currentLetterPosLeft +
          ($(currentLetter).width() as number) -
          caretWidth / 2
        : currentLetterPosLeft -
          ($(currentLetter).width() as number) +
          caretWidth / 2;
    }
  }

  let smoothlinescroll = $("#words .smoothScroller").height();
  if (smoothlinescroll === undefined) smoothlinescroll = 0;

  if (Config.smoothCaret) {
    caret.stop(true, false).animate(
      {
        top: newTop - smoothlinescroll,
        left: newLeft,
      },
      SlowTimer.get() ? 0 : 100
    );
  } else {
    caret.stop(true, true).animate(
      {
        top: newTop - smoothlinescroll,
        left: newLeft,
      },
      0
    );
  }

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
