import { getTestSettings } from "../test/engine/test-settings";
import { createMemo, createRoot } from "solid-js";

import { getConfig } from "../config/store";
import Format from "../singletons/format";
import * as TestWords from "../test/engine/test-words";
import { secondsToString } from "../utils/date-and-time";
import { getCurrentQuote, isFocusMode } from "./test";
import {
  getActiveWordIndex,
  isTestActive,
  getTestEnd,
  isTestFinished,
  liveStats,
} from "../test/engine/state";

/** Whether this test counts down a time limit rather than a number of words. */
function isTimeLimitedTest(): boolean {
  return (
    getTestSettings().mode === "time" ||
    (getTestSettings().mode === "custom" &&
      getTestSettings().customText.limit.mode === "time")
  );
}

/** Seconds the test counts down from. Only meaningful when {@link isTimeLimitedTest}. */
function getTestTimeLimit(): number {
  return getTestSettings().mode === "custom"
    ? getTestSettings().customText.limit.value
    : getTestSettings().time;
}

/**
 * Words completed so far. Derived from the activeWordIndex signal, so it must be
 * read inside a computation — never snapshotted into the store, since the input
 * handlers advance the index *after* the live stat updates run.
 */
function getCurrentWordCount(): number {
  if (
    getTestSettings().mode === "custom" &&
    getTestSettings().customText.limit.mode === "section"
  ) {
    const sectionIndex =
      TestWords.words.get(getActiveWordIndex())?.sectionIndex;
    return sectionIndex === undefined ? 0 : sectionIndex - 1;
  }
  return getActiveWordIndex();
}

function getWordsTotal(): number {
  if (getTestSettings().mode === "words") return getTestSettings().words;
  if (getTestSettings().mode === "custom") {
    return getTestSettings().customText.limit.value;
  }
  if (getTestSettings().mode === "quote") {
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
    const { seconds } = liveStats;
    const limit = getTestTimeLimit();
    if (seconds === undefined || limit === 0) {
      return { width: "100vw", duration: 0 };
    }
    return {
      width: `${100 - ((seconds + 1) / limit) * 100}vw`,
      duration: 1000,
      ease: "linear",
    };
  }
  const wordsTotal = getWordsTotal();
  // no elapsed time means the test was reset, so snap back instead of animating
  if (liveStats.seconds === undefined || wordsTotal === 0) {
    return { width: "0vw", duration: 0 };
  }
  // the active word index stops on the last word instead of going one past it,
  // so the word count alone tops out at (n-1)/n — fill the bar on finish.
  // finished: the bar outlives the words fading out
  if (isTestFinished() && getTestEnd()?.type !== "bailedOut") {
    return { width: "100vw", duration: 125 };
  }
  return {
    width: `${Math.floor((getCurrentWordCount() / wordsTotal) * 100)}vw`,
    duration: 250,
  };
}

export const showLiveStats = createRoot(() =>
  createMemo(() => isTestActive() && isFocusMode()),
);
export const getLiveSpeedText = createRoot(() =>
  createMemo(() =>
    Format.typingSpeed(
      (getConfig.blindMode ? liveStats.raw : liveStats.wpm) ?? 0,
      { showDecimalPlaces: false },
    ),
  ),
);
export const getLiveAccText = createRoot(() =>
  createMemo(
    () => `${getConfig.blindMode ? 100 : Math.floor(liveStats.acc ?? 100)}%`,
  ),
);
export const getLiveBurstText = createRoot(() =>
  createMemo(() =>
    Format.typingSpeed(liveStats.burst ?? 0, {
      showDecimalPlaces: false,
    }),
  ),
);

/** Countdown / word counter shown by the timer displays. */
export const getTimerText = createRoot(() =>
  createMemo(() => {
    if (isTimeLimitedTest()) {
      const limit = getTestTimeLimit();
      const seconds = liveStats.seconds ?? 0;
      return secondsToString(limit === 0 ? seconds : limit - seconds);
    }
    // read the signal first so the memo subscribes to it on every branch below
    const wordCount = getCurrentWordCount();
    const wordsTotal = getWordsTotal();
    if (getTestSettings().mode === "zen" || wordsTotal === 0) {
      return `${getActiveWordIndex()}`;
    }
    return `${wordCount}/${wordsTotal}`;
  }),
);
/**
 * The flash timer styles only reveal the time every 15 seconds. Only the flash
 * styles hide, and only on time limited tests — a word counter is always shown.
 */
export const isTimerFlashHidden = createRoot(() =>
  createMemo(() => {
    const isFlashStyle =
      getConfig.timerStyle === "flash_mini" ||
      getConfig.timerStyle === "flash_text";
    if (!isFlashStyle || !isTimeLimitedTest()) return false;
    return (getTestTimeLimit() - (liveStats.seconds ?? 0)) % 15 !== 0;
  }),
);
