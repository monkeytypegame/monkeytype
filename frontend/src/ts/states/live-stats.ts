import { createMemo } from "solid-js";

import { getConfig } from "../config/store";
import Format from "../singletons/format";
import * as CustomText from "../test/custom-text";
import * as TestWords from "../test/test-words";
import { secondsToString } from "../utils/date-and-time";
import {
  currentLiveStats,
  getActiveWordIndex,
  getBailedOut,
  getCurrentQuote,
  getFocus,
  isResultCalculating,
  isTestActive,
} from "./test";

/** Whether this test counts down a time limit rather than a number of words. */
function isTimeLimitedTest(): boolean {
  return (
    getConfig.mode === "time" ||
    (getConfig.mode === "custom" && CustomText.getLimitMode() === "time")
  );
}

/** Seconds the test counts down from. Only meaningful when {@link isTimeLimitedTest}. */
function getTestTimeLimit(): number {
  return getConfig.mode === "custom"
    ? CustomText.getLimitValue()
    : getConfig.time;
}

/**
 * Words completed so far. Derived from the activeWordIndex signal, so it must be
 * read inside a computation — never snapshotted into the store, since the input
 * handlers advance the index *after* the live stat updates run.
 */
function getCurrentWordCount(): number {
  if (getConfig.mode === "custom" && CustomText.getLimitMode() === "section") {
    const sectionIndex =
      TestWords.words.get(getActiveWordIndex())?.sectionIndex;
    return sectionIndex === undefined ? 0 : sectionIndex - 1;
  }
  return getActiveWordIndex();
}

function getWordsTotal(): number {
  if (getConfig.mode === "words") return getConfig.words;
  if (getConfig.mode === "custom") return CustomText.getLimitValue();
  if (getConfig.mode === "quote") {
    return getCurrentQuote()?.textSplit.length ?? 1;
  }
  return TestWords.words.length;
}

export function getBarTarget(): {
  width: string;
  duration: number;
  ease?: string;
} {
  if (isTimeLimitedTest()) {
    const { seconds } = currentLiveStats;
    const limit = getTestTimeLimit();
    if (seconds === undefined || limit === 0) return { width: "100vw", duration: 0 };
    return {
      width: `${100 - ((seconds + 1) / limit) * 100}vw`,
      duration: 1000,
      ease: "linear",
    };
  }
  const wordsTotal = getWordsTotal();
  // no elapsed time means the test was reset, so snap back instead of animating
  if (currentLiveStats.seconds === undefined || wordsTotal === 0) {
    return { width: "0vw", duration: 0 };
  }
  // the active word index stops on the last word instead of going one past it,
  // so the word count alone tops out at (n-1)/n — fill the bar on finish.
  // isResultCalculating flips on the first line of finish(); getResultVisible
  // would be a fade-out too late, since the bar outlives the words fading out.
  if (isResultCalculating() && !getBailedOut()) {
    return { width: "100vw", duration: 125 };
  }
  return {
    width: `${Math.floor((getCurrentWordCount() / wordsTotal) * 100)}vw`,
    duration: 250,
  };
}

export const showLiveStats = createMemo(() => isTestActive() && getFocus());
export const getLiveSpeedText = createMemo(() =>
  Format.typingSpeed(
    (getConfig.blindMode ? currentLiveStats.raw : currentLiveStats.wpm) ?? 0,
    { showDecimalPlaces: false },
  ),
);
export const getLiveAccText = createMemo(
  () =>
    `${getConfig.blindMode ? 100 : Math.floor(currentLiveStats.acc ?? 100)}%`,
);
export const getLiveBurstText = createMemo(() =>
  Format.typingSpeed(currentLiveStats.burst ?? 0, { showDecimalPlaces: false }),
);

/** Countdown / word counter shown by the timer displays. */
export const getTimerText = createMemo(() => {
  if (isTimeLimitedTest()) {
    const limit = getTestTimeLimit();
    const seconds = currentLiveStats.seconds ?? 0;
    return secondsToString(limit === 0 ? seconds : limit - seconds);
  }
  // read the signal first so the memo subscribes to it on every branch below
  const wordCount = getCurrentWordCount();
  const wordsTotal = getWordsTotal();
  if (getConfig.mode === "zen" || wordsTotal === 0) {
    return `${getActiveWordIndex()}`;
  }
  return `${wordCount}/${wordsTotal}`;
});
/**
 * The flash timer styles only reveal the time every 15 seconds. Only the flash
 * styles hide, and only on time limited tests — a word counter is always shown.
 */
export const isTimerFlashHidden = createMemo(() => {
  const isFlashStyle =
    getConfig.timerStyle === "flash_mini" ||
    getConfig.timerStyle === "flash_text";
  if (!isFlashStyle || !isTimeLimitedTest()) return false;
  return (getTestTimeLimit() - (currentLiveStats.seconds ?? 0)) % 15 !== 0;
});
