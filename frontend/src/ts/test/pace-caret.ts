import * as TestWords from "./test-words";
import { Config } from "../config/store";
import { getLocalPB } from "../queries/user";
import { getActiveTagsPB } from "../collections/tags";
import * as Misc from "../utils/misc";
import { configEvent } from "../events/config";
import { getActiveFunboxes } from "./funbox/list";
import { createSignal } from "solid-js";
import {
  getUserAverage10Once,
  getUserDailyBestOnce,
} from "../collections/results";
import {
  getActiveWordIndex,
  getCurrentQuote,
  isTestFinished,
  isPaceRepeat,
  isTestActive,
  setPaceCaretWpm,
} from "../states/test";

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

let settings: Settings | null = null;

/** Where the pace caret heads during a step. */
export type PaceCaretTarget = {
  wordIndex: number;
  letterIndex: number;
  /** when it gets there, performance.now() time: it moves at a linear pace */
  stepEnd: number;
};

const [paceCaretTarget, setPaceCaretTarget] = createSignal<
  PaceCaretTarget | undefined
>(undefined);

/**
 * The letter the pace caret is heading for, undefined while it's hidden
 * (no pace, test not started, out of words). Words draws it there.
 */
export { paceCaretTarget };

let lastTestWpm = 0;

export function setLastTestWpm(wpm: number): void {
  if (!isPaceRepeat() || (isPaceRepeat() && wpm > lastTestWpm)) {
    lastTestWpm = wpm;
  }
}

export async function init(): Promise<void> {
  setPaceCaretTarget(undefined);
  const mode2 = Misc.getMode2(Config, getCurrentQuote());
  let wpm = 0;
  if (Config.paceCaret === "pb") {
    wpm =
      getLocalPB(
        Config.mode,
        mode2,
        Config.punctuation,
        Config.numbers,
        Config.language,
        Config.difficulty,
        Config.lazyMode,
        getActiveFunboxes(),
      )?.wpm ?? 0;
  } else if (Config.paceCaret === "tagPb") {
    wpm = getActiveTagsPB(
      Config.mode,
      mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode,
    );
  } else if (Config.paceCaret === "average") {
    wpm = Math.round((await getUserAverage10Once({ ...Config, mode2 })).wpm);
  } else if (Config.paceCaret === "daily") {
    wpm = Math.round((await getUserDailyBestOnce({ ...Config, mode2 })).wpm);
  } else if (Config.paceCaret === "custom") {
    wpm = Config.paceCaretCustomSpeed;
  } else if (Config.paceCaret === "last" || isPaceRepeat()) {
    wpm = lastTestWpm;
  }
  if (wpm === undefined || wpm < 1 || Number.isNaN(wpm)) {
    settings = null;
    setPaceCaretWpm(undefined);
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
  setPaceCaretWpm(wpm);
}

export async function update(expectedStepEnd: number): Promise<void> {
  const currentSettings = settings;
  if (currentSettings === null || !isTestActive() || isTestFinished()) {
    return;
  }

  incrementLetterIndex();
  // out of words
  if (settings !== currentSettings) return;

  const absoluteStepEnd = startTimestamp + expectedStepEnd;
  const duration = absoluteStepEnd - performance.now();

  setPaceCaretTarget({
    wordIndex: currentSettings.currentWordIndex,
    letterIndex: currentSettings.currentLetterIndex,
    stepEnd: absoluteStepEnd,
  });

  currentSettings.timeout = setTimeout(
    () => {
      if (settings !== currentSettings) return;
      update(expectedStepEnd + (currentSettings.spc ?? 0) * 1000).catch(() => {
        if (settings === currentSettings) settings = null;
      });
    },
    Math.max(0, duration),
  );
}

export function reset(): void {
  if (settings?.timeout !== null && settings?.timeout !== undefined) {
    clearTimeout(settings.timeout);
  }
  settings = null;
  startTimestamp = 0;
  setPaceCaretTarget(undefined);
}

function incrementLetterIndex(): void {
  if (settings === null) return;

  try {
    if (
      settings.currentLetterIndex >=
      // oxlint-disable-next-line typescript/no-non-null-assertion let it throw if undefined
      TestWords.words.get(settings.currentWordIndex)!.text.length
    ) {
      //go to the next word
      settings.currentLetterIndex = -1;
      settings.currentWordIndex++;
    }
    settings.currentLetterIndex++;

    if (!Config.blindMode) {
      if (settings.correction < 0) {
        while (settings.correction < 0) {
          settings.currentLetterIndex--;
          if (settings.currentLetterIndex <= -1) {
            //go to the previous word
            settings.currentLetterIndex =
              // oxlint-disable-next-line typescript/no-non-null-assertion let it throw if undefined
              TestWords.words.get(settings.currentWordIndex - 1)!.text.length;
            settings.currentWordIndex--;
          }
          settings.correction++;
        }
      } else if (settings.correction > 0) {
        while (settings.correction > 0) {
          settings.currentLetterIndex++;
          if (
            settings.currentLetterIndex >=
            // oxlint-disable-next-line typescript/no-non-null-assertion let it throw if undefined
            TestWords.words.get(settings.currentWordIndex)!.text.length + 1
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
    setPaceCaretTarget(undefined);
    return;
  }
}

export function handleSpace(correct: boolean, currentWord: string): void {
  if (correct) {
    if (
      settings?.wordsStatus[getActiveWordIndex()] === true &&
      !Config.blindMode
    ) {
      settings.wordsStatus[getActiveWordIndex()] = undefined;
      settings.correction -= currentWord.length;
    }
  } else {
    if (
      settings !== null &&
      settings.wordsStatus[getActiveWordIndex()] === undefined &&
      !Config.blindMode
    ) {
      settings.wordsStatus[getActiveWordIndex()] = true;
      settings.correction += currentWord.length;
    }
  }
}

export function start(): void {
  const now = performance.now();
  startTimestamp = now;
  void update((settings?.spc ?? 0) * 1000);
}

configEvent.subscribe(({ key }) => {
  if (key === "paceCaret") void init();
});
