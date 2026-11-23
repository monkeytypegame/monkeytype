import { getTestSettings } from "./engine/test-settings";
import * as TestWords from "./engine/test-words";
import { getConfig } from "../config/store";
import { getLocalPB } from "../queries/user";
import { getActiveTagsPB } from "../queries/tags";
import * as Misc from "../utils/misc";
import { createEffectOn } from "../hooks/effects";
import { getActiveFunboxes } from "./funbox/list";
import { createRoot, createSignal } from "solid-js";
import {
  getUserAverage10Once,
  getUserDailyBestOnce,
} from "../collections/results";
import { getCurrentQuote, isPaceRepeat, setPaceCaretWpm } from "../states/test";
import { getActiveWordIndex, isTestActive } from "./engine/state";

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
  const mode2 = Misc.getMode2(getTestSettings(), getCurrentQuote());
  let wpm = 0;
  if (getConfig.paceCaret === "pb") {
    wpm =
      getLocalPB(
        getTestSettings().mode,
        mode2,
        getTestSettings().punctuation,
        getTestSettings().numbers,
        getTestSettings().language,
        getTestSettings().difficulty,
        getTestSettings().lazyMode,
        getActiveFunboxes(),
      )?.wpm ?? 0;
  } else if (getConfig.paceCaret === "tagPb") {
    wpm = getActiveTagsPB(
      getTestSettings().mode,
      mode2,
      getTestSettings().punctuation,
      getTestSettings().numbers,
      getTestSettings().language,
      getTestSettings().difficulty,
      getTestSettings().lazyMode,
    );
  } else if (getConfig.paceCaret === "average") {
    wpm = Math.round((await getUserAverage10Once({ ...getConfig, mode2 })).wpm);
  } else if (getConfig.paceCaret === "daily") {
    wpm = Math.round((await getUserDailyBestOnce({ ...getConfig, mode2 })).wpm);
  } else if (getConfig.paceCaret === "custom") {
    wpm = getConfig.paceCaretCustomSpeed;
  } else if (getConfig.paceCaret === "last" || isPaceRepeat()) {
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
  if (currentSettings === null || !isTestActive()) {
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

    if (!getConfig.blindMode) {
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
      !getConfig.blindMode
    ) {
      settings.wordsStatus[getActiveWordIndex()] = undefined;
      settings.correction -= currentWord.length;
    }
  } else {
    if (
      settings !== null &&
      settings.wordsStatus[getActiveWordIndex()] === undefined &&
      !getConfig.blindMode
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

// a root so the effect is owned, it lives as long as the page
createRoot(() => {
  createEffectOn(
    () => getConfig.paceCaret,
    () => void init(),
    { defer: true },
  );
});
