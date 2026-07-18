import { createMemo } from "solid-js";

import { getConfig } from "../../../../config/store";
import Format from "../../../../singletons/format";
import {
  currentLiveStats,
  getActiveWordIndex,
  getCurrentQuote,
  getFocus,
  isTestActive,
} from "../../../../states/test";
import * as CustomText from "../../../../test/custom-text";
import * as TestWords from "../../../../test/test-words";
import { secondsToString } from "../../../../utils/date-and-time";

/** Whether this test counts down a time limit rather than a number of words. */
export function isTimeLimitedTest(): boolean {
  return (
    getConfig.mode === "time" ||
    (getConfig.mode === "custom" && CustomText.getLimitMode() === "time")
  );
}

/** Seconds the test counts down from. Only meaningful when {@link isTimeLimitedTest}. */
export function getTestTimeLimit(): number {
  return getConfig.mode === "custom"
    ? CustomText.getLimitValue()
    : getConfig.time;
}

/**
 * Words completed so far. Derived from the activeWordIndex signal, so it must be
 * read inside a computation — never snapshotted into the store, since the input
 * handlers advance the index *after* the live stat updates run.
 */
export function getCurrentWordCount(): number {
  if (getConfig.mode === "custom" && CustomText.getLimitMode() === "section") {
    const sectionIndex =
      TestWords.words.get(getActiveWordIndex())?.sectionIndex;
    return sectionIndex === undefined ? 0 : sectionIndex - 1;
  }
  return getActiveWordIndex();
}

export function getWordsTotal(): number {
  if (getConfig.mode === "words") return getConfig.words;
  if (getConfig.mode === "custom") return CustomText.getLimitValue();
  if (getConfig.mode === "quote") {
    return getCurrentQuote()?.textSplit.length ?? 1;
  }
  return TestWords.words.length;
}

/** Live stats are only on screen while a test is running and the user is typing. */
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
