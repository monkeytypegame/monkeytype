import Config from "./config";
import * as DB from "./db";
import { updateTestModesNotice } from "./dom-util";

export let caret = null;

export async function init() {
  let mode2 = "";
  if (Config.mode === "time") {
    mode2 = Config.time;
  } else if (Config.mode === "words") {
    mode2 = Config.words;
  } else if (Config.mode === "custom") {
    mode2 = "custom";
  } else if (Config.mode === "quote") {
    mode2 = randomQuote.id;
  }
  let wpm;
  if (Config.paceCaret === "pb") {
    wpm = await DB.getLocalPB(
      Config.mode,
      mode2,
      Config.punctuation,
      Config.language,
      Config.difficulty
    );
  } else if (Config.paceCaret === "average") {
    let mode2 = "";
    if (Config.mode === "time") {
      mode2 = Config.time;
    } else if (Config.mode === "words") {
      mode2 = Config.words;
    } else if (Config.mode === "custom") {
      mode2 = "custom";
    } else if (Config.mode === "quote") {
      mode2 = randomQuote.id;
    }
    wpm = await DB.getUserAverageWpm10(
      Config.mode,
      mode2,
      Config.punctuation,
      Config.language,
      Config.difficulty
    );
    console.log("avg pace " + wpm);
  } else if (Config.paceCaret === "custom") {
    wpm = Config.paceCaretCustomSpeed;
  }

  if (wpm < 1 || wpm == false || wpm == undefined || Number.isNaN(wpm)) {
    caret = null;
    return;
  }

  let characters = wpm * 5;
  let cps = characters / 60; //characters per step
  let spc = 60 / characters; //seconds per character

  caret = {
    wpm: wpm,
    cps: cps,
    spc: spc,
    correction: 0,
    currentWordIndex: 0,
    currentLetterIndex: -1,
    wordsStatus: {},
    timeout: null,
  };

  updateTestModesNotice(sameWordset, textHasTab, activeFunbox);
}

export function updatePosition(expectedStepEnd) {
  if (caret === null || !testActive || resultVisible) {
    return;
  }
  if ($("#paceCaret").hasClass("hidden")) {
    $("#paceCaret").removeClass("hidden");
  }
  if ($("#paceCaret").hasClass("off")) {
    return;
  }
  try {
    caret.currentLetterIndex++;
    if (caret.currentLetterIndex >= wordsList[caret.currentWordIndex].length) {
      //go to the next word
      caret.currentLetterIndex = -1;
      caret.currentWordIndex++;
    }
    if (!Config.blindMode) {
      if (caret.correction < 0) {
        while (caret.correction < 0) {
          caret.currentLetterIndex--;
          if (caret.currentLetterIndex <= -2) {
            //go to the previous word
            caret.currentLetterIndex =
              wordsList[caret.currentWordIndex - 1].length - 1;
            caret.currentWordIndex--;
          }
          caret.correction++;
        }
      } else if (caret.correction > 0) {
        while (caret.correction > 0) {
          caret.currentLetterIndex++;
          if (
            caret.currentLetterIndex >= wordsList[caret.currentWordIndex].length
          ) {
            //go to the next word
            caret.currentLetterIndex = -1;
            caret.currentWordIndex++;
          }
          caret.correction--;
        }
      }
    }
  } catch (e) {
    //out of words
    caret = null;
    $("#paceCaret").addClass("hidden");
    return;
  }

  try {
    let caretEl = $("#paceCaret");
    let currentLetter;
    let newTop;
    let newLeft;
    try {
      let newIndex =
        caret.currentWordIndex - (currentWordIndex - currentWordElementIndex);
      if (caret.currentLetterIndex === -1) {
        currentLetter = document
          .querySelectorAll("#words .word")
          [newIndex].querySelectorAll("letter")[0];
      } else {
        currentLetter = document
          .querySelectorAll("#words .word")
          [newIndex].querySelectorAll("letter")[caret.currentLetterIndex];
      }
      newTop = currentLetter.offsetTop - $(currentLetter).height() / 20;
      newLeft;
      if (caret.currentLetterIndex === -1) {
        newLeft = currentLetter.offsetLeft;
      } else {
        newLeft =
          currentLetter.offsetLeft +
          $(currentLetter).width() -
          caretEl.width() / 2;
      }
      caretEl.removeClass("hidden");
    } catch (e) {
      caretEl.addClass("hidden");
    }

    let smoothlinescroll = $("#words .smoothScroller").height();
    if (smoothlinescroll === undefined) smoothlinescroll = 0;

    $("#paceCaret").css({
      top: newTop - smoothlinescroll,
    });

    let duration = expectedStepEnd - performance.now();

    if (Config.smoothCaret) {
      caretEl.stop(true, true).animate(
        {
          left: newLeft,
        },
        duration,
        "linear"
      );
    } else {
      caretEl.stop(true, true).animate(
        {
          left: newLeft,
        },
        0,
        "linear"
      );
    }
    caret.timeout = setTimeout(() => {
      try {
        updatePosition(expectedStepEnd + caret.spc * 1000);
      } catch (e) {
        caret = null;
      }
    }, duration);
  } catch (e) {
    console.error(e);
    $("#paceCaret").addClass("hidden");
  }
}

export function reset() {
  resetPosition();
  caret = null;
  if (caret !== null) clearTimeout(caret.timeout);
}

export function resetPosition() {
  if (Config.paceCaret === "off") return;
  if (!$("#paceCaret").hasClass("hidden")) {
    $("#paceCaret").addClass("hidden");
  }
  if (Config.mode === "zen") return;

  let caretEl = $("#paceCaret");
  let firstLetter = document
    .querySelector("#words .word")
    .querySelector("letter");

  caretEl.stop(true, true).animate(
    {
      top: firstLetter.offsetTop - $(firstLetter).height() / 4,
      left: firstLetter.offsetLeft,
    },
    0,
    "linear"
  );

  caret = null;
  if (caret !== null) clearTimeout(caret.timeout);
}
