import * as TestStats from "./test-stats";
import * as TestWords from "./test-words";
import * as TestUI from "./test-ui";
import Config from "../config";
import * as DB from "../db";
import * as SlowTimer from "../states/slow-timer";
import * as Misc from "../misc";
import * as TestActive from "../states/test-active";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";

interface Settings {
  wpm: number;
  cps: number;
  spc: number;
  correction: number;
  currentWordIndex: number;
  currentLetterIndex: number;
  wordsStatus: { [key: number]: any };
  timeout: NodeJS.Timeout | null;
}

export let settings: Settings | null = null;

function resetCaretPosition(): void {
  if (Config.paceCaret === "off" && !TestState.isPaceRepeat) return;
  if (!$("#paceCaret").hasClass("hidden")) {
    $("#paceCaret").addClass("hidden");
  }
  if (Config.mode === "zen") return;

  const caret = $("#paceCaret");
  const firstLetter = <HTMLElement>(
    document?.querySelector("#words .word")?.querySelector("letter")
  );

  const firstLetterHeight = $(firstLetter).height();

  if (firstLetter === undefined || firstLetterHeight === undefined) return;

  caret.stop(true, true).animate(
    {
      top: firstLetter.offsetTop - firstLetterHeight / 4,
      left: firstLetter.offsetLeft,
    },
    0,
    "linear"
  );
}

export async function init(): Promise<void> {
  $("#paceCaret").addClass("hidden");
  const mode2 = Misc.getMode2(
    Config,
    TestWords.randomQuote
  ) as MonkeyTypes.Mode2<typeof Config.mode>;
  let wpm;
  if (Config.paceCaret === "pb") {
    wpm = await DB.getLocalPB(
      Config.mode,
      mode2,
      Config.punctuation,
      Config.language,
      Config.difficulty,
      Config.lazyMode,
      Config.funbox
    );
  } else if (Config.paceCaret === "average") {
    wpm = await DB.getUserAverageWpm10(
      Config.mode,
      mode2,
      Config.punctuation,
      Config.language,
      Config.difficulty,
      Config.lazyMode
    );
    wpm = Math.round(wpm);
  } else if (Config.paceCaret === "custom") {
    wpm = Config.paceCaretCustomSpeed;
  } else if (TestState.isPaceRepeat == true) {
    wpm = TestStats.lastTestWpm;
  }
  if (wpm === undefined || wpm < 1 || Number.isNaN(wpm)) {
    settings = null;
    return;
  }

  const characters = wpm * 5;
  const cps = characters / 60; //characters per step
  const spc = 60 / characters; //seconds per character

  settings = {
    wpm: wpm,
    cps: cps,
    spc: spc,
    correction: 0,
    currentWordIndex: 0,
    currentLetterIndex: -1,
    wordsStatus: {},
    timeout: null,
  };
  resetCaretPosition();
}

export function update(expectedStepEnd: number): void {
  if (settings === null || !TestActive.get() || TestUI.resultVisible) {
    return;
  }
  if ($("#paceCaret").hasClass("hidden")) {
    $("#paceCaret").removeClass("hidden");
  }
  try {
    settings.currentLetterIndex++;
    if (
      settings.currentLetterIndex >=
      TestWords.words.get(settings.currentWordIndex).length
    ) {
      //go to the next word
      settings.currentLetterIndex = -1;
      settings.currentWordIndex++;
    }
    if (!Config.blindMode) {
      if (settings.correction < 0) {
        while (settings.correction < 0) {
          settings.currentLetterIndex--;
          if (settings.currentLetterIndex <= -2) {
            //go to the previous word
            settings.currentLetterIndex =
              TestWords.words.get(settings.currentWordIndex - 1).length - 1;
            settings.currentWordIndex--;
          }
          settings.correction++;
        }
      } else if (settings.correction > 0) {
        while (settings.correction > 0) {
          settings.currentLetterIndex++;
          if (
            settings.currentLetterIndex >=
            TestWords.words.get(settings.currentWordIndex).length
          ) {
            //go to the next word
            settings.currentLetterIndex = -1;
            settings.currentWordIndex++;
          }
          settings.correction--;
        }
      }
    }
  } catch (e) {
    //out of words
    settings = null;
    $("#paceCaret").addClass("hidden");
    return;
  }

  try {
    const caret = $("#paceCaret");
    let currentLetter;
    let newTop;
    let newLeft;
    try {
      const newIndex =
        settings.currentWordIndex -
        (TestWords.words.currentIndex - TestUI.currentWordElementIndex);
      const word = document.querySelectorAll("#words .word")[newIndex];
      if (settings.currentLetterIndex === -1) {
        currentLetter = <HTMLElement>word.querySelectorAll("letter")[0];
      } else {
        currentLetter = <HTMLElement>(
          word.querySelectorAll("letter")[settings.currentLetterIndex]
        );
      }

      const currentLetterHeight = $(currentLetter).height(),
        currentLetterWidth = $(currentLetter).width(),
        caretWidth = caret.width();

      if (
        currentLetterHeight === undefined ||
        currentLetterWidth === undefined ||
        caretWidth === undefined
      ) {
        throw ``;
      }

      newTop = currentLetter.offsetTop - currentLetterHeight / 5;
      newLeft;
      if (settings.currentLetterIndex === -1) {
        newLeft = currentLetter.offsetLeft;
      } else {
        newLeft =
          currentLetter.offsetLeft + currentLetterWidth - caretWidth / 2;
      }
      caret.removeClass("hidden");
    } catch (e) {
      caret.addClass("hidden");
    }

    if (newTop === undefined) return;

    let smoothlinescroll = $("#words .smoothScroller").height();
    if (smoothlinescroll === undefined) smoothlinescroll = 0;

    $("#paceCaret").css({
      top: newTop - smoothlinescroll,
    });

    const duration = expectedStepEnd - performance.now();

    if (Config.smoothCaret) {
      caret.stop(true, true).animate(
        {
          left: newLeft,
        },
        SlowTimer.get() ? 0 : duration,
        "linear"
      );
    } else {
      caret.stop(true, true).animate(
        {
          left: newLeft,
        },
        0,
        "linear"
      );
    }
    settings.timeout = setTimeout(() => {
      try {
        update(expectedStepEnd + (settings?.spc ?? 0) * 1000);
      } catch (e) {
        settings = null;
      }
    }, duration);
  } catch (e) {
    console.error(e);
    $("#paceCaret").addClass("hidden");
  }
}

export function reset(): void {
  if (settings !== null && settings.timeout !== null) {
    clearTimeout(settings.timeout);
  }
  settings = null;
}

export function handleSpace(correct: boolean, currentWord: string): void {
  if (correct) {
    if (
      settings !== null &&
      settings.wordsStatus[TestWords.words.currentIndex] === true &&
      !Config.blindMode
    ) {
      settings.wordsStatus[TestWords.words.currentIndex] = undefined;
      settings.correction -= currentWord.length + 1;
    }
  } else {
    if (
      settings !== null &&
      settings.wordsStatus[TestWords.words.currentIndex] === undefined &&
      !Config.blindMode
    ) {
      settings.wordsStatus[TestWords.words.currentIndex] = true;
      settings.correction += currentWord.length + 1;
    }
  }
}

export function start(): void {
  update(performance.now() + (settings?.spc ?? 0) * 1000);
}

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "paceCaret") init();
});
