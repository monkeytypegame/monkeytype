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
  getTestPhase,
  setTestEnd,
  setKoreanStatus,
  setLastBurst,
  setTestPhase,
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
    if (getTestPhase() === "active") setTestPhase("idle");
    setTestEnd(null);
    setKoreanStatus(false);
  });
}

/** A restart began: its fade-out starts. */
export function restart(): void {
  setTestPhase("restarting");
}

/** The restart is over: the new test is ready, or init gave up. */
export function endRestart(): void {
  setTestPhase("idle");
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
