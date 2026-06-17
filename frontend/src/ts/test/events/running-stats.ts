import { EventLog } from "./types";
import { getTimerStartEventMs } from "./helpers";
import { getChars } from "./stats";
import { calculateWpm } from "../../utils/numbers";
import { getLiveCache } from "./data";

export function getRunningTestDurationMs(
  eventLog: EventLog,
  now: number,
): number {
  const start = getTimerStartEventMs(eventLog.events);
  if (start === undefined) return 0;
  return now - start;
}

export function getRunningAccuracy(eventLog: EventLog): number {
  let correct = 0;
  let total = 0;

  for (const event of eventLog.events) {
    if (event.type === "input" && "correct" in event.data) {
      total++;
      if (event.data.correct) {
        correct++;
      }
    }
  }

  return total === 0 ? 100 : (correct / total) * 100;
}

// Fast path for the live test: reads a running tally maintained in data.ts
// instead of rescanning the event log. For replay, use getRunningAccuracy(eventLog).
export function getLiveCachedAccuracy(): number {
  const { correctInputs, totalInputs } = getLiveCache();
  return totalInputs === 0 ? 100 : (correctInputs / totalInputs) * 100;
}

export function getRunningWpmAndRaw(
  eventLog: EventLog,
  now: number,
): {
  wpm: number;
  raw: number;
} {
  const chars = getChars(eventLog, true);
  const currentTestDurationMs = getRunningTestDurationMs(eventLog, now);
  const wpm = Math.round(
    calculateWpm(chars.correctWord, currentTestDurationMs / 1000),
  );
  const raw = Math.round(
    calculateWpm(
      chars.allCorrect + chars.extra + chars.incorrect,
      currentTestDurationMs / 1000,
    ),
  );
  return { wpm, raw };
}
