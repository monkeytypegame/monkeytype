import { batch, createMemo, createRoot, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { roundTo2 } from "@monkeytype/util/numbers";
import { createTrigger } from "../../hooks/createTrigger";
import { requestDebouncedAnimationFrame } from "../../utils/debounced-animation-frame";
import { getLiveCachedAccuracy } from "./events/live-cache";
import { EventLog } from "./events/types";

/**
 * Engine state: only this folder writes it. Everything else reads the signals
 * here and calls the commands here or in ./commands (start, finish, reset,
 * restart).
 */

/**
 * - idle: words ready, waiting for the first keystroke
 * - active: typing, the timer runs
 * - finished: from the end of the words fade-out until a restart, passed or
 *   failed (see getFailReason)
 * - restarting: from the restart's first fade-out until the new test is ready
 */
export type Phase = "idle" | "active" | "finished" | "restarting";

// T6c: finish/fail switch the phase on their first line, not after the words
// fade-out; T6b: restart fades follow the phase.
// setters exported for engine/commands only
export const [getPhase, setPhase] = createSignal<Phase>("idle");

// ---- words

const [getActiveWordIndex, setActiveWordIndex] = createSignal(0);
export { getActiveWordIndex };

export function nextWord(): void {
  setActiveWordIndex((i) => i + 1);
}

export function previousWord(): void {
  setActiveWordIndex((i) => i - 1);
}

/** Back to the first word (words reset or regenerated). */
export function resetActiveWordIndex(): void {
  setActiveWordIndex(0);
}

// Facts about the generated words. Words aren't reactive (T6b regenerates
// them from the test settings), so these are set with them, not derived.
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

// ---- fail reason

// setter for engine/commands only
/** Why the finished test failed ("min accuracy", "slow timer"…); null if it passed. */
export const [getFailReason, setFailReason] = createSignal<string | null>(null);

// ---- bail out

export const [getBailedOut, setBailedOut] = createSignal(false);

/** The user ends the test early: it counts, but doesn't run to its limit. */
export function bailOut(): void {
  setBailedOut(true);
}

// ---- frozen log

let frozenLog: EventLog | null = null;
const [getFrozenLog, setFrozenLog] = createSignal<EventLog | null>(null);
/** The finished test's event log: the result's input. */
export { getFrozenLog };

/** engine/commands only: finish() freezes the log here. */
export function freezeLog(log: EventLog): void {
  frozenLog = log;
}

/**
 * Publishes the log finish() froze. test-logic calls it in the batch that
 * sets the result, so readers never pair a new log with an old result.
 * T6c: the engine publishes it with its own result signal.
 */
export function publishFrozenLog(): void {
  setFrozenLog(frozenLog);
}

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
