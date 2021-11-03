import * as Misc from "./misc";
import Config from "./config";
import * as TestLogic from "./test-logic";

export let caretAnimating = true;

export function stopAnimation() {
  if (caretAnimating === true) {
    $("#caret").css("animation-name", "none");
    $("#caret").css("opacity", "1");
    caretAnimating = false;
  }
}

export function startAnimation() {
  if (caretAnimating === false) {
    if (Config.smoothCaret) {
      $("#caret").css("animation-name", "caretFlashSmooth");
    } else {
      $("#caret").css("animation-name", "caretFlashHard");
    }
    caretAnimating = true;
  }
}

export function hide() {
  $("#caret").addClass("hidden");
}

export async function updatePosition() {
  if ($("#wordsWrapper").hasClass("hidden")) return;
  // if ($("#caret").hasClass("off")) {
  //   return;
  // }

  let caret = $("#caret");

  let inputLen = TestLogic.input.current.length;
  inputLen = Misc.trailingComposeChars.test(TestLogic.input.current)
    ? TestLogic.input.current.search(Misc.trailingComposeChars) + 1
    : inputLen;
  let currentLetterIndex = inputLen - 1;
  if (currentLetterIndex == -1) {
    currentLetterIndex = 0;
  }
  try {
    //insert temporary character so the caret will work in zen mode
    let activeWordEmpty = $("#words .active").children().length == 0;
    if (activeWordEmpty) {
      $("#words .active").append('<letter style="opacity: 0;">_</letter>');
    }

    let currentWordNodeList = document
      .querySelector("#words .active")
      .querySelectorAll("letter");
    let currentLetter = currentWordNodeList[currentLetterIndex];
    if (inputLen > currentWordNodeList.length) {
      currentLetter = currentWordNodeList[currentWordNodeList.length - 1];
    }

    if (Config.mode != "zen" && $(currentLetter).length == 0) return;
    const currentLanguage = await Misc.getCurrentLanguage();
    const isLanguageLeftToRight = currentLanguage.leftToRight;
    let currentLetterPosLeft = isLanguageLeftToRight
      ? currentLetter.offsetLeft
      : currentLetter.offsetLeft + $(currentLetter).width();
    let currentLetterPosTop = currentLetter.offsetTop;
    let letterHeight = $(currentLetter).height();
    let newTop = 0;
    let newLeft = 0;

    newTop = currentLetterPosTop - Math.round(letterHeight / 5);
    if (inputLen == 0) {
      newLeft = isLanguageLeftToRight
        ? currentLetterPosLeft - caret.width() / 2
        : currentLetterPosLeft + caret.width() / 2;
    } else {
      newLeft = isLanguageLeftToRight
        ? currentLetterPosLeft + $(currentLetter).width() - caret.width() / 2
        : currentLetterPosLeft - $(currentLetter).width() + caret.width() / 2;
    }

    let smoothlinescroll = $("#words .smoothScroller").height();
    if (smoothlinescroll === undefined) smoothlinescroll = 0;

    if (Config.smoothCaret) {
      caret.stop(true, false).animate(
        {
          top: newTop - smoothlinescroll,
          left: newLeft,
        },
        100
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
      let browserHeight = window.innerHeight;
      let middlePos = browserHeight / 2 - $("#caret").outerHeight() / 2;
      let contentHeight = document.body.scrollHeight;

      if (newTop >= middlePos && contentHeight > browserHeight) {
        let newscrolltop = newTop - middlePos / 2;
        // console.log('---------');
        // console.log(newTop);
        // console.log(middlePos);
        // console.log(browserHeight);
        // console.log(contentHeight);
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
  } catch (e) {
    console.log("could not move caret: " + e.message);
  }
}

export function show() {
  if ($("#result").hasClass("hidden")) {
    updatePosition();
    $("#caret").removeClass("hidden");
    startAnimation();
  }
}
