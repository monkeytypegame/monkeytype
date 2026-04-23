import { promiseWithResolvers } from "../utils/misc";

export let isRepeated = false;
export let isPaceRepeat = false;
export let isActive = false;
export let bailedOut = false;
export let selectedQuoteId = 1;
export let activeWordIndex = 0;
export let testInitSuccess = true;
export let isLanguageRightToLeft = false;
export let isDirectionReversed = false;
export let testRestarting = false;
export let resultVisible = false;
/** Max quotes remembered for "previous quote" navigation (per session). */
export const MAX_QUOTE_HISTORY_LENGTH = 50;

export const quoteHistory: number[] = [];
export let quoteHistoryIndex = -1;

export function setRepeated(tf: boolean): void {
  isRepeated = tf;
}

export function setPaceRepeat(tf: boolean): void {
  isPaceRepeat = tf;
}

export function setActive(tf: boolean): void {
  isActive = tf;
}

export function setBailedOut(tf: boolean): void {
  bailedOut = tf;
}

export function setSelectedQuoteId(id: number): void {
  selectedQuoteId = id;
}

export function setActiveWordIndex(index: number): void {
  activeWordIndex = index;
}

export function increaseActiveWordIndex(): void {
  activeWordIndex++;
}

export function decreaseActiveWordIndex(): void {
  activeWordIndex--;
}

export function setTestInitSuccess(tf: boolean): void {
  testInitSuccess = tf;
}

export function setIsLanguageRightToLeft(rtl: boolean): void {
  isLanguageRightToLeft = rtl;
}

export function setIsDirectionReversed(val: boolean): void {
  isDirectionReversed = val;
}

const {
  promise: testRestartingPromise,
  resolve: restartingResolve,
  reset: resetTestRestarting,
} = promiseWithResolvers();

export { testRestartingPromise };

export function setTestRestarting(val: boolean): void {
  testRestarting = val;
  if (val) {
    resetTestRestarting();
  } else {
    restartingResolve();
  }
}

export function setResultVisible(val: boolean): void {
  resultVisible = val;
}

/**
 * Id of the quote that would load if we navigate back, without mutating history.
 * Call {@link commitPreviousNavigation} only after that quote was resolved successfully.
 */
export function peekPreviousQuoteId(): number | null {
  if (quoteHistoryIndex <= 0) {
    return null;
  }
  const val = quoteHistory[quoteHistoryIndex - 1];
  return val ?? null;
}

/** Apply a successful "previous quote" navigation (decrements the history cursor). */
export function commitPreviousNavigation(): void {
  if (quoteHistoryIndex <= 0) {
    return;
  }
  quoteHistoryIndex--;
}

export function pushQuoteToHistory(quoteId: number): void {
  if (quoteHistoryIndex < quoteHistory.length - 1) {
    quoteHistory.splice(quoteHistoryIndex + 1);
  }

  quoteHistory.push(quoteId);
  quoteHistoryIndex++;

  if (quoteHistory.length > MAX_QUOTE_HISTORY_LENGTH) {
    quoteHistory.shift();
    quoteHistoryIndex--;
  }
}

export function resetQuoteHistory(): void {
  quoteHistory.length = 0;
  quoteHistoryIndex = -1;
}
