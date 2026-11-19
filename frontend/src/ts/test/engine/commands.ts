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
  getRestartOptions,
  getRestartStage,
  getTestPhase,
  setLastBurst,
  setRestartOptions,
  setRestartSource,
  setRestartStage,
  setTestPhase,
  type RestartOptions,
  type RestartSource,
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

// A restart takes in requests until test-logic starts generating the new test
// (takeRestartRequests): later ones merge into it, since the settings are
// read after them. Requests after that queue one more restart, which starts
// once this one ends.
let acceptingRequests = false;
let queued: Partial<RestartOptions> | null = null;

function mergeRequests(
  into: Partial<RestartOptions>,
  next: Partial<RestartOptions>,
): Partial<RestartOptions> {
  return {
    withSameWordset:
      (into.withSameWordset ?? false) || (next.withSameWordset ?? false),
    practiseMissed:
      (into.practiseMissed ?? false) || (next.practiseMissed ?? false),
    noAnim: next.noAnim ?? into.noAnim,
  };
}

function toOptions(request: Partial<RestartOptions>): RestartOptions {
  return {
    withSameWordset: request.withSameWordset ?? false,
    practiseMissed: request.practiseMissed ?? false,
    noAnim: request.noAnim ?? false,
  };
}

/**
 * Requests a restart. Starts one (the old test fades out) or merges into the
 * one taking requests. After that one took the settings, only a settings
 * change (`settingsChanged`) queues one more restart; any other request is
 * dropped: the test it asks for is the one being prepared.
 */
export function requestRestart(
  source: RestartSource,
  options: Partial<RestartOptions>,
  settingsChanged = false,
): "started" | "merged" | "queued" | "dropped" {
  if (getTestPhase() !== "restarting") {
    acceptingRequests = true;
    batch(() => {
      setRestartOptions(toOptions(options));
      setRestartSource(source);
      setRestartStage("fadingOut");
      setTestPhase("restarting");
    });
    return "started";
  }
  if (acceptingRequests) {
    setRestartOptions((current) => toOptions(mergeRequests(current, options)));
    return "merged";
  }
  if (!settingsChanged) return "dropped";
  queued = mergeRequests(queued ?? {}, options);
  return "queued";
}

/** TestPage: the old test or result has faded out. */
export function restartFadedOut(): void {
  if (getRestartStage() === "fadingOut") setRestartStage("preparing");
}

/**
 * test-logic, right before it generates the words: retakes the test settings
 * (config plus `customText`). Requests from now on queue another restart.
 * Returns the merged options.
 */
export function takeRestartRequests(
  customText: CustomTextSettings,
): RestartOptions {
  acceptingRequests = false;
  takeTestSettings(customText);
  return getRestartOptions();
}

/**
 * test-logic, when generating the words failed and it tries again: the retry
 * reads the settings anew, so requests queued meanwhile (including the
 * generator's own fallback writes) merge into it.
 */
export function reopenRestartRequests(): void {
  if (getTestPhase() !== "restarting" || acceptingRequests) return;
  acceptingRequests = true;
  if (queued !== null) {
    const next = queued;
    queued = null;
    setRestartOptions((current) => toOptions(mergeRequests(current, next)));
  }
}

/** test-logic: the new test is ready to fade in. */
export function restartPrepared(): void {
  if (getRestartStage() === "preparing") setRestartStage("fadingIn");
}

/**
 * The restart is over: the new test faded in, or init gave up. Returns the
 * options of a restart queued meanwhile, for the caller to request.
 */
export function endRestart(): Partial<RestartOptions> | null {
  acceptingRequests = false;
  const next = queued;
  queued = null;
  batch(() => {
    setRestartStage(undefined);
    setTestPhase("idle");
  });
  return next;
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
