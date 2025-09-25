import * as TestWords from "./test-words";
import Config from "../config";
import * as DB from "../db";
import * as Misc from "../utils/misc";
import * as TestState from "./test-state";
import * as ConfigEvent from "../observables/config-event";
import { getActiveFunboxes } from "./funbox/list";
import { Caret } from "../utils/caret";

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

export const caret = new Caret(
  document.getElementById("paceCaret") as HTMLElement,
  Config.paceCaretStyle
);

let lastTestWpm = 0;

export function setLastTestWpm(wpm: number): void {
  if (
    !TestState.isPaceRepeat ||
    (TestState.isPaceRepeat && wpm > lastTestWpm)
  ) {
    lastTestWpm = wpm;
  }
}

export function resetCaretPosition(): void {
  if (Config.paceCaret === "off" && !TestState.isPaceRepeat) return;
  if (Config.mode === "zen") return;

  caret.hide();
  caret.stopAllAnimations();
  caret.clearMargins();

  caret.goTo({
    wordIndex: 0,
    letterIndex: 0,
    isLanguageRightToLeft: TestState.isLanguageRightToLeft,
    animate: false,
  });
}

export async function init(): Promise<void> {
  caret.hide();
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
          getActiveFunboxes()
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
    currentLetterIndex: 0,
    wordsStatus: {},
    timeout: null,
  };
}

export async function update(duration: number): Promise<void> {
  if (settings === null || !TestState.isActive || TestState.resultVisible) {
    return;
  }

  if (caret.isHidden()) {
    caret.show();
  }

  incrementLetterIndex();

  try {
    caret.goTo({
      wordIndex: settings.currentWordIndex,
      letterIndex: settings.currentLetterIndex,
      isLanguageRightToLeft: TestState.isLanguageRightToLeft,
      animate: true,
      animationOptions: {
        duration,
        easing: "linear",
      },
    });
    settings.timeout = setTimeout(() => {
      update((settings?.spc ?? 0) * 1000).catch(() => {
        settings = null;
      });
    }, duration);
  } catch (e) {
    console.error(e);
    caret.hide();
    return;
  }
}

export function reset(): void {
  if (settings?.timeout !== null && settings?.timeout !== undefined) {
    clearTimeout(settings.timeout);
  }
  settings = null;
}

function incrementLetterIndex(): void {
  if (settings === null) return;

  try {
    settings.currentLetterIndex++;
    if (
      settings.currentLetterIndex >=
      TestWords.words.get(settings.currentWordIndex).length + 1
    ) {
      //go to the next word
      settings.currentLetterIndex = 0;
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
            settings.currentLetterIndex = 0;
            settings.currentWordIndex++;
          }
          settings.correction--;
        }
      }
    }
  } catch (e) {
    //out of words
    settings = null;
    console.log("pace caret out of words");
    caret.hide();
    return;
  }
}

export function handleSpace(correct: boolean, currentWord: string): void {
  if (correct) {
    if (
      settings !== null &&
      settings.wordsStatus[TestState.activeWordIndex] === true &&
      !Config.blindMode
    ) {
      settings.wordsStatus[TestState.activeWordIndex] = undefined;
      settings.correction -= currentWord.length + 1;
    }
  } else {
    if (
      settings !== null &&
      settings.wordsStatus[TestState.activeWordIndex] === undefined &&
      !Config.blindMode
    ) {
      settings.wordsStatus[TestState.activeWordIndex] = true;
      settings.correction += currentWord.length + 1;
    }
  }
}

export function start(): void {
  void update((settings?.spc ?? 0) * 1000);
}

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "paceCaret") void init();
  if (eventKey === "paceCaretStyle") {
    caret.setStyle(Config.paceCaretStyle);
  }
});
