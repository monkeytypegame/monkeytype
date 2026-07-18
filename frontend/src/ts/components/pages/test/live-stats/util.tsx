import { createMemo } from "solid-js";

import { getConfig } from "../../../../config/store";
import Format from "../../../../singletons/format";
import {
  currentLiveStats,
  getActiveWordIndex,
  getCurrentQuote,
  getFocus,
  isTestActive,
  setCurrentLiveStats,
} from "../../../../states/test";
import * as CustomText from "../../../../test/custom-text";
import { getLiveCachedTestSeconds } from "../../../../test/events/live-cache";
import * as TestWords from "../../../../test/test-words";
import { secondsToString } from "../../../../utils/date-and-time";
import {
  cancelPendingAnimationFrame,
  requestDebouncedAnimationFrame,
} from "../../../../utils/debounced-animation-frame";

const LIVE_PROGRESS_FRAME = "live-progress.update";

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
  const {
    seconds = 0,
    wordIndex = 0,
    wordCount = 0,
    wordsTotal,
  } = currentLiveStats;

  if (isTimeLimitedTest()) {
    const limit = getTestTimeLimit();
    return secondsToString(limit === 0 ? seconds : limit - seconds);
  }
  if (
    getConfig.mode === "zen" ||
    wordsTotal === undefined ||
    wordsTotal === 0
  ) {
    return `${wordIndex}`;
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

export const resetCurrentLiveStats = (): void => {
  // drop any in flight progress frame, it would repopulate the store after this
  cancelPendingAnimationFrame(LIVE_PROGRESS_FRAME);
  setCurrentLiveStats({
    wpm: undefined,
    acc: undefined,
    raw: undefined,
    burst: undefined,
    seconds: undefined,
    wordIndex: undefined,
    wordCount: undefined,
    wordsTotal: undefined,
  });
};

/**
 * Copies the test engine's progress (elapsed time, word position) into the store.
 * Time and activeWordIndex are plain vanilla values, so this has to be called
 * whenever they move: every timer tick and every input.
 *
 * Deferred a frame because the input handlers advance activeWordIndex *after*
 * calling this — reading it synchronously would leave the counter a word behind.
 */
export function updateLiveProgress(now: number): void {
  requestDebouncedAnimationFrame(LIVE_PROGRESS_FRAME, () => {
    setCurrentLiveStats({
      seconds: getLiveCachedTestSeconds(now),
      wordIndex: getActiveWordIndex(),
      wordCount: getCurrentWordCount(),
      wordsTotal: getWordsTotal(),
    });
  });
}
