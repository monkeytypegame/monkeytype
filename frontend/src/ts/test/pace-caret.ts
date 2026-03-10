import * as TestWords from "./test-words";
import Config from "../config";
import * as DB from "../db";
import * as Misc from "../utils/misc";
import * as TestState from "./test-state";
import * as CustomText from "./custom-text";
import * as WordsGenerator from "./words-generator";
import * as ConfigEvent from "../observables/config-event";
import { getActiveFunboxes } from "./funbox/list";
import { Caret } from "../utils/caret";
import { qsr } from "../utils/dom";

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

let startTimestamp = 0;

export let settings: Settings | null = null;

export const caret = new Caret(qsr("#paceCaret"), Config.paceCaretStyle);

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
    isDirectionReversed: TestState.isDirectionReversed,
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
          getActiveFunboxes(),
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
      Config.lazyMode,
    );
  } else if (Config.paceCaret === "average") {
    [wpm] = await DB.getUserAverage10(
      Config.mode,
      mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode,
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
      Config.lazyMode,
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

export async function update(expectedStepEnd: number): Promise<void> {
  const currentSettings = settings;
  if (
    currentSettings === null ||
    !TestState.isActive ||
    TestState.resultVisible
  ) {
    return;
  }

  const nextExpectedStepEnd =
    expectedStepEnd + (currentSettings.spc ?? 0) * 1000;

  if (!incrementLetterIndex()) {
    if (shouldRetryWhenWordsMayStillGenerate(currentSettings)) {
      scheduleUpdate(
        currentSettings,
        nextExpectedStepEnd,
        Math.max(16, getDelayUntilStepEnd(nextExpectedStepEnd)),
      );
    } else {
      settings = null;
    }
    return;
  }

  if (caret.isHidden()) {
    caret.show();
  }

  try {
    const duration = getDelayUntilStepEnd(expectedStepEnd);

    caret.goTo({
      wordIndex: currentSettings.currentWordIndex,
      letterIndex: currentSettings.currentLetterIndex,
      isLanguageRightToLeft: TestState.isLanguageRightToLeft,
      isDirectionReversed: TestState.isDirectionReversed,
      animate: true,
      animationOptions: {
        duration,
        easing: "linear",
      },
    });

    scheduleUpdate(currentSettings, nextExpectedStepEnd, Math.max(0, duration));
  } catch (e) {
    console.error(e);
    caret.hide();
    return;
  }
}

function getDelayUntilStepEnd(stepEnd: number): number {
  return startTimestamp + stepEnd - performance.now();
}

function scheduleUpdate(
  currentSettings: Settings,
  nextExpectedStepEnd: number,
  delay: number,
): void {
  currentSettings.timeout = setTimeout(() => {
    if (settings !== currentSettings) return;
    update(nextExpectedStepEnd).catch(() => {
      if (settings === currentSettings) settings = null;
    });
  }, delay);
}

function shouldRetryWhenWordsMayStillGenerate(
  currentSettings: Settings,
): boolean {
  if (settings !== currentSettings) return false;
  return !areAllTestWordsGenerated();
}

function areAllTestWordsGenerated(): boolean {
  if (Config.mode === "words") {
    return TestWords.words.length >= Config.words && Config.words > 0;
  }

  if (Config.mode === "quote") {
    return (
      TestWords.words.length >= (TestWords.currentQuote?.textSplit?.length ?? 0)
    );
  }

  if (Config.mode === "custom") {
    const limitMode = CustomText.getLimitMode();
    const limitValue = CustomText.getLimitValue();

    if (limitMode === "word") {
      return TestWords.words.length >= limitValue && limitValue !== 0;
    }

    if (limitMode === "section") {
      return (
        WordsGenerator.sectionIndex >= limitValue &&
        WordsGenerator.currentSection.length === 0 &&
        limitValue !== 0
      );
    }
  }

  return false;
}

export function reset(): void {
  if (settings?.timeout !== null && settings?.timeout !== undefined) {
    clearTimeout(settings.timeout);
  }
  settings = null;
  startTimestamp = 0;
}

function incrementLetterIndex(): boolean {
  if (settings === null) return false;

  const previousWordIndex = settings.currentWordIndex;
  const previousLetterIndex = settings.currentLetterIndex;
  const previousCorrection = settings.correction;

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
  } catch {
    settings.currentWordIndex = previousWordIndex;
    settings.currentLetterIndex = previousLetterIndex;
    settings.correction = previousCorrection;
    caret.hide();
    return false;
  }

  return true;
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
  const now = performance.now();
  startTimestamp = now;
  void update((settings?.spc ?? 0) * 1000);
}

ConfigEvent.subscribe(({ key }) => {
  if (key === "paceCaret") void init();
  if (key === "paceCaretStyle") {
    caret.setStyle(Config.paceCaretStyle);
  }
});
