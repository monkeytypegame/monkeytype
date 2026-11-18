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
  getPhase,
  setBailedOut,
  setFailReason,
  setKoreanStatus,
  setLastBurst,
  setPhase,
  startLiveStats,
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
    setPhase("active");
    TestTimer.clear();
    startLiveStats();
  });
}

/**
 * Freezes the test: force-releases held keys, switches to finished (failed
 * when given a reason) and builds the frozen log. Doesn't publish it: see
 * publishFrozenLog().
 */
export function finish(failReason: string | null = null): EventLog {
  // T6c: runs on finish()'s first line and drops events logged after it
  forceReleaseAllKeys();
  batch(() => {
    setPhase("finished");
    setFailReason(failReason);
  });
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
    if (getPhase() === "active") setPhase("idle");
    setBailedOut(false);
    setFailReason(null);
    setKoreanStatus(false);
  });
}

/** A restart began: its fade-out starts. */
export function restart(): void {
  setPhase("restarting");
}

/** The restart is over: the new test is ready, or init gave up. */
export function endRestart(): void {
  setPhase("idle");
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
