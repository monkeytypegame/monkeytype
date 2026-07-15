import { roundTo2 } from "@monkeytype/util/numbers";
import { TestEvent } from "./types";

// Running tallies maintained as events arrive, so live readers don't rescan
// the event log. For replay, derive from the event log directly.
const cache = {
  correctInputs: 0,
  totalInputs: 0,
  timerStartMs: null as number | null,
  msSinceLastInputEvent: {
    value: null as number | null,
    lastEventMs: null as number | null,
  },
};

export function resetLiveCache(): void {
  cache.correctInputs = 0;
  cache.totalInputs = 0;
  cache.timerStartMs = null;
  cache.msSinceLastInputEvent.value = null;
  cache.msSinceLastInputEvent.lastEventMs = null;
}

export function recordEventForCache(event: TestEvent): void {
  if (event.type === "input") {
    if ("correct" in event.data) {
      cache.totalInputs++;
      if (event.data.correct) cache.correctInputs++;
    }
    if (cache.msSinceLastInputEvent.lastEventMs !== null) {
      cache.msSinceLastInputEvent.value = roundTo2(
        event.ms - cache.msSinceLastInputEvent.lastEventMs,
      );
    }
    cache.msSinceLastInputEvent.lastEventMs = event.ms;
  } else if (event.type === "timer" && event.data.event === "start") {
    cache.timerStartMs = event.ms;
  }
}

export function getLiveCachedAccuracy(): number {
  return cache.totalInputs === 0
    ? 100
    : (cache.correctInputs / cache.totalInputs) * 100;
}

export function getLiveCachedMsSinceLastInputEvent(): number | null {
  return cache.msSinceLastInputEvent.value;
}

export function getLiveCachedTestDurationMs(now: number): number {
  if (cache.timerStartMs === null) {
    throw new Error("Timer start ms not found in cache");
  }
  return now - cache.timerStartMs;
}
