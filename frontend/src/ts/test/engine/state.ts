import { batch, createMemo, createRoot, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { roundTo2 } from "@monkeytype/util/numbers";
import { createSignalWithSetters } from "../../hooks/createSignalWithSetters";
import { createTrigger } from "../../hooks/createTrigger";
import { requestDebouncedAnimationFrame } from "../../utils/debounced-animation-frame";
import { getLiveCachedAccuracy } from "./events/live-cache";
import type { ResultData } from "./result-data";

/**
 * Engine state: only this folder writes it. Everything else reads the signals
 * here and calls the commands here or in ./commands (start, finish, reset,
 * restart).
 */

/**
 * - idle: words ready, waiting for the first keystroke
 * - active: typing, the timer runs
 * - finished: from finish() (the finish keystroke) until a restart, passed or
 *   failed (see getTestEnd). The result follows a paint later (getResultData)
 * - restarting: from the restart request until the new test is generated
 */
export type TestPhase = "idle" | "active" | "finished" | "restarting";

// read through the helpers below; setter for engine/commands only
const [getTestPhase, setTestPhase] = createSignal<TestPhase>("idle");
export { setTestPhase };

/** The test is running: typing, the timer runs. */
export function isTestActive(): boolean {
  return getTestPhase() === "active";
}

/** The test ended: from finish() until a restart. */
export function isTestFinished(): boolean {
  return getTestPhase() === "finished";
}

/** From the restart request until the new test is generated. */
export function isTestRestarting(): boolean {
  return getTestPhase() === "restarting";
}

// ---- restart

/** Options of a restart: the request that started it sets them. */
export type RestartOptions = {
  /** Same words as the last test. */
  withSameWordset: boolean;
  /** Skip the fades. */
  noAnim: boolean;
};

// setters for engine/commands only
export const [getRestartOptions, setRestartOptions] =
  createSignal<RestartOptions>({
    withSameWordset: false,
    noAnim: false,
  });

/**
 * Changes when a restart commits a new test (generated, or init gave up).
 * TestPage swaps the new test in once it has faded the old one out.
 */
export const [getTestId, setTestId] = createSignal(0);

// ---- words

// steps by one only; resetActiveWordIndex: words reset or regenerated
export const [
  getActiveWordIndex,
  { incrementActiveWordIndex, decrementActiveWordIndex, resetActiveWordIndex },
] = createSignalWithSetters(0)({
  incrementActiveWordIndex: (set) => set((i) => i + 1),
  decrementActiveWordIndex: (set) => set((i) => i - 1),
  resetActiveWordIndex: (set) => set(0),
});

// Facts about the generated words. Words aren't reactive (a restart
// regenerates them from the test settings), so these are set with them, not
// derived.
const [wordsHaveNewline, setWordsHaveNewline] = createSignal(false);
const [wordsHaveTab, setWordsHaveTab] = createSignal(false);
const [wordsHaveNumbers, setWordsHaveNumbers] = createSignal(false);
export const [getKoreanStatus, setKoreanStatus] = createSignal(false);
export { wordsHaveNewline, wordsHaveTab, wordsHaveNumbers };

export function setWordsInfo(info: {
  hasNewline: boolean;
  hasTab: boolean;
  hasNumbers: boolean;
  hasKorean: boolean;
}): void {
  batch(() => {
    setWordsHaveNewline(info.hasNewline);
    setWordsHaveTab(info.hasTab);
    setWordsHaveNumbers(info.hasNumbers);
    setKoreanStatus(info.hasKorean);
  });
}

// ---- test end

/**
 * How the test ended. bailedOut: the user ended it early; it counts, but
 * doesn't run to its limit. failed: a fail check stopped it ("min accuracy",
 * "slow timer"…).
 */
export type TestEnd =
  | { type: "completed" }
  | { type: "bailedOut" }
  | { type: "failed"; reason: string };

// setter for engine/commands only
/** How the test ended; null until it ends. */
export const [getTestEnd, setTestEnd] = createSignal<TestEnd | null>(null);

// ---- result

/**
 * The last finished test's result: null from finish() until the engine built
 * it, then kept until the next finish (a restart keeps it).
 */
export const [getResultData, setResultData] = createSignal<ResultData | null>(
  null,
);

/** The test finished and its result isn't built yet. */
export function isResultPending(): boolean {
  return isTestFinished() && getResultData() === null;
}

/**
 * Saving the last result: test-logic hands the engine its save
 * (Engine.save); a restart goes back to idle.
 */
export type SaveStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved" }
  | { state: "failed"; canRetry: boolean };

// setter for engine/commands only
export const [getSaveStatus, setSaveStatus] = createSignal<SaveStatus>({
  state: "idle",
});

// ---- live stats

// set by the timer each second
const [timerStats, setTimerStats] = createStore<{
  wpm?: number;
  raw?: number;
  seconds?: number;
}>({});

/** Timer tick: wpm, raw and seconds so far. */
export function setTimerLiveStats(stats: {
  wpm: number;
  raw: number;
  seconds: number;
}): void {
  setTimerStats(stats);
}

// derived from the log: recomputed once per frame after it changes, so
// logging an event never renders synchronously
const [trackLiveStats, triggerLiveStats] = createTrigger();

/** Recompute the live acc and burst on the next frame. */
export function scheduleLiveStatsFlush(): void {
  requestDebouncedAnimationFrame("engine.liveStats", triggerLiveStats);
}

// true between a restart clearing the stats and the next start
let liveStatsCleared = true;
let lastBurst: number | undefined;

/** engine/commands only: a test starts, the live stats start from zero. */
export function startLiveStats(): void {
  setTimerStats({ wpm: 0, raw: 0, seconds: 0 });
  liveStatsCleared = false;
  lastBurst = 0;
  scheduleLiveStatsFlush();
}

/** Clears the live stats shown: no data until the next test starts. */
export function clearLiveStats(): void {
  setTimerStats({ wpm: undefined, raw: undefined, seconds: undefined });
  liveStatsCleared = true;
  lastBurst = undefined;
  scheduleLiveStatsFlush();
}

/** Records the burst of the word just submitted. */
export function setLastBurst(burst: number): void {
  lastBurst = Math.round(burst);
  scheduleLiveStatsFlush();
}

const liveAcc = createRoot(() =>
  createMemo<number | undefined>((prev) => {
    trackLiveStats();
    if (liveStatsCleared) return undefined;
    const acc = roundTo2(getLiveCachedAccuracy() ?? 100);
    return isNaN(acc) ? prev : acc;
  }),
);

const liveBurst = createRoot(() =>
  createMemo(() => {
    trackLiveStats();
    return lastBurst;
  }),
);

/** `undefined`: no data yet, displays fall back to their defaults. */
export const liveStats = {
  get wpm(): number | undefined {
    return timerStats.wpm;
  },
  get raw(): number | undefined {
    return timerStats.raw;
  },
  get seconds(): number | undefined {
    return timerStats.seconds;
  },
  get acc(): number | undefined {
    return liveAcc();
  },
  get burst(): number | undefined {
    return liveBurst();
  },
};

export const __testing = {
  getTestPhase,
};
