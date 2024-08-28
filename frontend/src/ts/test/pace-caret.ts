import * as TestWords from "./test-words";
import * as TestUI from "./test-ui";
import Config from "../config";
import * as DB from "../db";
import * as SlowTimer from "../states/slow-timer";
import * as Misc from "../utils/misc";
import * as Numbers from "../utils/numbers";
import * as JSONData from "../utils/json-data";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";

type Settings = {
  wpm: number;
  cps: number;
  spc: number;
  correction: number;
  currentWordIndex: number;
  currentLetterIndex: number;
  wordsStatus: Record<number, true | undefined>;
  timeout: NodeJS.Timeout | null;
};

export let settings: Settings | null = null;

let lastTestWpm = 0;

export function setLastTestWpm(wpm: number): void {
  if (
    !TestState.isPaceRepeat ||
    (TestState.isPaceRepeat && wpm > lastTestWpm)
  ) {
    lastTestWpm = wpm;
  }
}

async function resetCaretPosition(): Promise<void> {
  if (Config.paceCaret === "off" && !TestState.isPaceRepeat) return;
  if (!$("#paceCaret").hasClass("hidden")) {
    $("#paceCaret").addClass("hidden");
  }
  if (Config.mode === "zen") return;

  const caret = $("#paceCaret");
  const firstLetter = document
    ?.querySelector("#words .word")
    ?.querySelector("letter") as HTMLElement;

  const firstLetterHeight = $(firstLetter).height();

  if (firstLetter === undefined || firstLetterHeight === undefined) return;

  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRightToLeft = currentLanguage.rightToLeft;

  caret.stop(true, true).animate(
    {
      top: firstLetter.offsetTop - firstLetterHeight / 4,
      left:
        firstLetter.offsetLeft +
        (isLanguageRightToLeft ? firstLetter.offsetWidth : 0),
    },
    0,
    "linear"
  );
}

export async function init(): Promise<void> {
  $("#paceCaret").addClass("hidden");
  const mode2 = Misc.getMode2(Config, TestWords.currentQuote);
  let wpm = 0;
  if (Config.paceCaret === "pb") {
    wpm =
      (
        await DB.getLocalPB(
          Config.mode,
          mode2,
          Config.punctuation,
          Config.numbers,
          Config.language,
          Config.difficulty,
          Config.lazyMode,
          Config.funbox
        )
      )?.wpm ?? 0;
  } else if (Config.paceCaret === "tagPb") {
    wpm = await DB.getActiveTagsPB(
      Config.mode,
      mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode
    );
  } else if (Config.paceCaret === "average") {
    [wpm] = await DB.getUserAverage10(
      Config.mode,
      mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode
    );
    wpm = Math.round(wpm);
  } else if (Config.paceCaret === "daily") {
    wpm = await DB.getUserDailyBest(
      Config.mode,
      mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode
    );
    wpm = Math.round(wpm);
  } else if (Config.paceCaret === "custom") {
    wpm = Config.paceCaretCustomSpeed;
  } else if (Config.paceCaret === "last" || TestState.isPaceRepeat) {
    wpm = lastTestWpm;
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
  await resetCaretPosition();
}

export async function update(expectedStepEnd: number): Promise<void> {
  if (settings === null || !TestState.isActive || TestUI.resultVisible) {
    return;
  }
  // if ($("#paceCaret").hasClass("hidden")) {
  //   $("#paceCaret").removeClass("hidden");
  // }

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
        (TestWords.words.currentIndex - TestUI.activeWordElementIndex);
      const word = document.querySelectorAll("#words .word")[
        newIndex
      ] as HTMLElement;
      if (settings.currentLetterIndex === -1) {
        currentLetter = word.querySelectorAll("letter")[0] as HTMLElement;
      } else {
        currentLetter = word.querySelectorAll("letter")[
          settings.currentLetterIndex
        ] as HTMLElement;
      }

      const currentLetterHeight = $(currentLetter).height(),
        currentLetterWidth = $(currentLetter).width(),
        caretWidth = caret.width();

      if (
        currentLetterHeight === undefined ||
        currentLetterWidth === undefined ||
        caretWidth === undefined
      ) {
        throw new Error(
          "Undefined current letter height, width or caret width."
        );
      }

      const currentLanguage = await JSONData.getCurrentLanguage(
        Config.language
      );
      const isLanguageRightToLeft = currentLanguage.rightToLeft;

      newTop =
        word.offsetTop +
        currentLetter.offsetTop -
        Config.fontSize * Numbers.convertRemToPixels(1) * 0.1;
      if (settings.currentLetterIndex === -1) {
        newLeft =
          word.offsetLeft +
          currentLetter.offsetLeft -
          caretWidth / 2 +
          (isLanguageRightToLeft ? currentLetterWidth : 0);
      } else {
        newLeft =
          word.offsetLeft +
          currentLetter.offsetLeft -
          caretWidth / 2 +
          (isLanguageRightToLeft ? 0 : currentLetterWidth);
      }
      caret.removeClass("hidden");
    } catch (e) {
      caret.addClass("hidden");
    }

    const duration = expectedStepEnd - performance.now();

    if (newTop !== undefined) {
      let smoothlinescroll = $("#words .smoothScroller").height();
      if (smoothlinescroll === undefined) smoothlinescroll = 0;

      $("#paceCaret").css({
        top: newTop - smoothlinescroll,
      });

      if (Config.smoothCaret !== "off") {
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
    }
    settings.timeout = setTimeout(() => {
      update(expectedStepEnd + (settings?.spc ?? 0) * 1000).catch(() => {
        settings = null;
      });
    }, duration);
  } catch (e) {
    console.error(e);
    $("#paceCaret").addClass("hidden");
  }
}

export function reset(): void {
  if (settings?.timeout != null) {
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
  void update(performance.now() + (settings?.spc ?? 0) * 1000);
}

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "paceCaret") void init();
});
