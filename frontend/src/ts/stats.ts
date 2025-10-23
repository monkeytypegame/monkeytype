/**
 * Statistics tracking for live typing sessions.
 * Integrates with Monkeytype's existing test pipeline.
 */

import { isMinorSwap } from "./typing";

/**
 * Core typing counters maintained throughout a test session.
 */
export type TypingCounters = {
  totalCharsTyped: number;
  realErrors: number; // Non-swap errors
  minorSwapErrors: number; // Adjacent-letter swaps only
  startedAt: number; // performance.now() timestamp
  lastUpdateAt: number; // performance.now() timestamp
};

/**
 * WPM calculation result.
 */
export type WpmSnapshot = {
  rawWPM: number;
  potentialWPM: number;
  minorSwapErrors: number;
};

/**
 * Global state for typing counters.
 * Accessed directly by the pipeline - integrates with existing Monkeytype architecture.
 */
let typingCounters: TypingCounters = {
  totalCharsTyped: 0,
  realErrors: 0,
  minorSwapErrors: 0,
  startedAt: performance.now(),
  lastUpdateAt: performance.now(),
};

/**
 * Get current counter values (for debugging or stats display).
 */
export function getTypingCounters(): Readonly<TypingCounters> {
  return { ...typingCounters };
}

/**
 * Reset all counters at the start of a new test.
 * Call this in test-logic.ts restart() function.
 */
export function resetTypingCounters(now = performance.now()): void {
  typingCounters = {
    totalCharsTyped: 0,
    realErrors: 0,
    minorSwapErrors: 0,
    startedAt: now,
    lastUpdateAt: now,
  };
}

/**
 * Process a completed word submission.
 * Call this in input-controller.ts when a word is committed (space pressed or auto-advance).
 *
 * @param actual - The word the user typed (may include trailing underscores as markers)
 * @param expected - The target word from the test
 * @param charCount - Number of characters to add to totalCharsTyped (default: actual.length)
 */
export function processTypedWord(
  actual: string,
  expected: string,
  charCount = actual.length
): void {
  // Strip trailing underscores from actual word before comparison
  // Underscores are just markers added by Monkeytype to show where space was pressed
  const actualWithoutTrailingUnderscore = actual.replace(/_+$/, "");

  const isSwap = isMinorSwap(actualWithoutTrailingUnderscore, expected);
  const errorCount = isSwap
    ? 0
    : computeErrorCount(actualWithoutTrailingUnderscore, expected);

  typingCounters = {
    totalCharsTyped: typingCounters.totalCharsTyped + charCount,
    realErrors: typingCounters.realErrors + errorCount,
    minorSwapErrors: typingCounters.minorSwapErrors + (isSwap ? 1 : 0),
    startedAt: typingCounters.startedAt,
    lastUpdateAt: performance.now(),
  };
}

/**
 * Optional: Increment typed characters for live per-keystroke tracking.
 * Use this if you want to update totalCharsTyped on every keystroke.
 */
export function incrementTypedCharacters(count: number): void {
  if (count === 0) return;

  typingCounters = {
    ...typingCounters,
    totalCharsTyped: typingCounters.totalCharsTyped + count,
    lastUpdateAt: performance.now(),
  };
}

/**
 * Internal helper: compute error count for a word pair.
 * Adjacent swaps return 0 errors (handled separately as minorSwapErrors).
 * Trailing underscores are stripped before comparison.
 */
function computeErrorCount(actual: string, expected: string): number {
  // Strip trailing underscores from actual word
  const actualCleaned = actual.replace(/_+$/, "");

  if (isMinorSwap(actualCleaned, expected)) {
    return 0;
  }

  const maxLength = Math.max(actualCleaned.length, expected.length);
  let errors = 0;

  for (let i = 0; i < maxLength; i++) {
    const actualChar = actualCleaned[i] ?? "";
    const expectedChar = expected[i] ?? "";
    if (actualChar !== expectedChar) {
      errors++;
    }
  }

  return errors;
}

/**
 * Calculate WPM metrics from raw counters.
 * - rawWPM includes all typed characters (standard WPM calculation).
 * - potentialWPM excludes realErrors but includes minorSwapErrors.
 *
 * @param totalChars - Total characters typed
 * @param realErrors - Non-swap errors
 * @param minorSwaps - Adjacent-letter swap count (tracked for analytics)
 * @param minutes - Elapsed time in minutes
 */
export function calculateWPM(
  totalChars: number,
  realErrors: number,
  minorSwaps: number,
  minutes: number
): WpmSnapshot {
  // Prevent division by zero
  const safeMinutes = minutes <= 0 ? Number.EPSILON : minutes;

  const rawWPM = totalChars / 5 / safeMinutes;
  const potentialWPM = Math.max(totalChars - realErrors, 0) / 5 / safeMinutes;

  return {
    rawWPM,
    potentialWPM,
    minorSwapErrors: minorSwaps,
  };
}

/**
 * Get current WPM snapshot based on live counters.
 * Call this to get real-time WPM values during active typing.
 */
export function getCurrentWpmSnapshot(): WpmSnapshot {
  const minutesElapsed =
    (typingCounters.lastUpdateAt - typingCounters.startedAt) / (1000 * 60);

  return calculateWPM(
    typingCounters.totalCharsTyped,
    typingCounters.realErrors,
    typingCounters.minorSwapErrors,
    minutesElapsed
  );
}
