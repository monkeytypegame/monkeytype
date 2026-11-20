import { batch } from "solid-js";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { Config } from "../../config/store";
import { isDevEnvironment } from "../../utils/env";
import { getWordBurst } from "./events/stats";
import {
  buildEventLog,
  cleanupData,
  forceReleaseAllKeys,
  freezeEvents,
  logEventsDataToTheConsoleTable,
  resetTestEvents,
} from "./events/data";
import { afterPaint } from "./after-paint";
import { buildResultData } from "./result-data";
import {
  clearLiveStats,
  getSaveStatus,
  setResultData,
  setSaveStatus,
  getActiveWordIndex,
  isTestActive,
  isTestFinished,
  isTestRestarting,
  setTestEnd,
  setKoreanStatus,
  setLastBurst,
  setRestartOptions,
  setTestId,
  setTestPhase,
  type RestartOptions,
  startLiveStats,
  type TestEnd,
} from "./state";
import * as TestTimer from "./test-timer";

// The engine's lifecycle commands. Kept apart from ./state, which the timer
// and the EventLog import, so the imports don't cycle.

/**
 * First keystroke: the test is active. test-logic starts the timer after the
 * funbox and pace caret start hooks.
 */
export function start(): void {
  batch(() => {
    setTestPhase("active");
    TestTimer.clear();
    startLiveStats();
  });
}

// counts finishes: a result built for an older one is dropped
let finishCount = 0;

/**
 * Ends the test, synchronously: stops the timer, force-releases held keys and
 * freezes the log (later events are dropped), then switches to finished. The
 * result is built after the next paint, so the words' fade-out can start
 * first (getResultData; isResultPending until then).
 */
export function finish(end: TestEnd): void {
  if (!isTestActive()) return;
  TestTimer.clear(true, performance.now());
  forceReleaseAllKeys();
  freezeEvents();
  batch(() => {
    setTestEnd(end);
    setResultData(null);
    setTestPhase("finished");
  });
  const token = ++finishCount;
  afterPaint(() => {
    if (token !== finishCount || !isTestFinished()) return;
    cleanupData();
    if (isDevEnvironment()) logEventsDataToTheConsoleTable();
    setResultData(buildResultData(buildEventLog(), end));
  });
}

// the last save, kept for a retry
let saveRun: ((isRetrying: boolean) => Promise<SaveOutcome>) | undefined;

/** How a save went: canRetry when the server may accept it later. */
export type SaveOutcome = { saved: true } | { saved: false; canRetry: boolean };

/**
 * Saves the last result with `run` (test-logic's request) without awaiting
 * it, and keeps `run` for retrySave(). getSaveStatus() follows it.
 */
export function save(run: (isRetrying: boolean) => Promise<SaveOutcome>): void {
  saveRun = run;
  void runSave(run, false);
}

/** Retries the last save. False when there's nothing to retry. */
export function retrySave(): boolean {
  const status = getSaveStatus();
  if (saveRun === undefined || status.state !== "failed" || !status.canRetry) {
    return false;
  }
  void runSave(saveRun, true);
  return true;
}

async function runSave(
  run: (isRetrying: boolean) => Promise<SaveOutcome>,
  isRetrying: boolean,
): Promise<void> {
  setSaveStatus({ state: "saving" });
  const outcome = await run(isRetrying);
  // a restart meanwhile cleared it
  if (saveRun !== run) return;
  setSaveStatus(
    outcome.saved
      ? { state: "saved" }
      : { state: "failed", canRetry: outcome.canRetry },
  );
}

/** Resets the test's data. Phase: active → idle (finished stays until a restart). */
export function reset(): void {
  resetTestEvents();
  TestTimer.clear();
  batch(() => {
    if (isTestActive()) setTestPhase("idle");
    setTestEnd(null);
    setKoreanStatus(false);
    setSaveStatus({ state: "idle" });
  });
  saveRun = undefined;
}

// ---- restart

// the current generation's token: a newer request supersedes the one running
let generation = 0;

/**
 * Starts a restart: the phase is restarting until commitRestart(). During
 * one, a request supersedes the generation in progress (the options stay).
 * Returns the token the generation checks with isCurrentRestart().
 */
export function requestRestart(options: Partial<RestartOptions>): number {
  if (!isTestRestarting()) {
    batch(() => {
      setRestartOptions({
        withSameWordset: options.withSameWordset ?? false,
        noAnim: options.noAnim ?? false,
      });
      setTestPhase("restarting");
    });
  }
  return ++generation;
}

/** Whether the generation holding `token` is still the one to commit. */
export function isCurrentRestart(token: number): boolean {
  return token === generation && isTestRestarting();
}

/**
 * The generation holding `token` is done (or init gave up): commits a new
 * test id and switches to idle. False when it was superseded.
 */
export function commitRestart(token: number): boolean {
  if (!isCurrentRestart(token)) return false;
  batch(() => {
    setTestId((id) => id + 1);
    setTestPhase("idle");
    clearLiveStats();
  });
  return true;
}

/**
 * The active word is submitted: measures its burst for the live burst and the
 * min burst check. null when neither needs it.
 */
export function measureWordBurst(now: number): number | null {
  if (Config.minBurst === "off" && Config.liveBurstStyle === "off") return null;
  const burst = getWordBurst(buildEventLog(), getActiveWordIndex(), now);
  if (isSafeNumber(burst)) setLastBurst(burst);
  return burst;
}
