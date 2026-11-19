import { batch } from "solid-js";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { Config } from "../../config/store";
import { isDevEnvironment } from "../../utils/env";
import { getWordBurst } from "./events/stats";
import {
  buildEventLog,
  cleanupData,
  forceReleaseAllKeys,
  logEventsDataToTheConsoleTable,
  resetTestEvents,
} from "./events/data";
import { EventLog } from "./events/types";
import {
  freezeLog,
  getActiveWordIndex,
  isTestActive,
  setTestEnd,
  setKoreanStatus,
  getTestPhase,
  setLastBurst,
  setRestartOptions,
  setTestId,
  setTestPhase,
  type RestartOptions,
  startLiveStats,
  type TestEnd,
} from "./state";
import * as TestTimer from "./test-timer";
import { takeTestSettings } from "./test-settings";
import type { CustomTextSettings } from "@monkeytype/schemas/results";

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

/**
 * The test is ending: records how, before the words fade out (the words
 * progress bar reads it at once). T6c: part of finish(), on its first line.
 */
export function recordEnd(end: TestEnd): void {
  setTestEnd(end);
}

/**
 * Freezes the test: force-releases held keys, switches to finished and builds
 * the frozen log. Doesn't publish it: see publishFrozenLog().
 */
export function finish(): EventLog {
  // T6c: runs on finish()'s first line and drops events logged after it
  forceReleaseAllKeys();
  setTestPhase("finished");
  cleanupData();
  if (isDevEnvironment()) logEventsDataToTheConsoleTable();
  const log = buildEventLog();
  freezeLog(log);
  return log;
}

/** Resets the test's data. Phase: active → idle (finished stays until a restart). */
export function reset(): void {
  resetTestEvents();
  TestTimer.clear();
  batch(() => {
    if (isTestActive()) setTestPhase("idle");
    setTestEnd(null);
    setKoreanStatus(false);
  });
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
  if (getTestPhase() !== "restarting") {
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
  return token === generation && getTestPhase() === "restarting";
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
  });
  return true;
}

/**
 * test-logic, right before it generates the words: retakes the test
 * settings (config plus `customText`).
 */
export function retakeTestSettings(customText: CustomTextSettings): void {
  takeTestSettings(customText);
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
