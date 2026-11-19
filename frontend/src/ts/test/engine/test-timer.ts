import { getTestSettings } from "./test-settings";
//most of the code is thanks to
//https://stackoverflow.com/questions/29971898/how-to-create-an-accurate-timer-in-javascript

import { createSignal } from "solid-js";
import { createTimer } from "animejs";
import { buildEventLog, logTestEvent } from "./events/data";
import { roundTo2 } from "@monkeytype/util/numbers";
import {
  getLiveCachedAccuracy,
  getLiveCachedTestDurationMs,
  getLiveCachedTestSeconds,
  getLiveCachedTimerStartMs,
} from "./events/live-cache";
import { getChars } from "./events/stats";
import { calculateWpm } from "../../utils/numbers";
import { getActiveWordIndex, isTestActive, setTimerLiveStats } from "./state";

export type TimerHandlers = {
  onFinish: () => void;
  onFail: (reason: string) => void;
};

// set by start(): test-logic passes its finish/fail (importing them here would be circular)
let onFinish: TimerHandlers["onFinish"] = () => undefined;
let onFail: TimerHandlers["onFail"] = () => undefined;

let emittedTicks = 0;
let stopped = true;

// Seconds elapsed, one write per tick (catch-up ticks included), 0 before the
// first. Per-tick side effects outside the engine (time warning, layoutfluid)
// are effects on it: test/timer-effects.ts.
const [getTimerTick, setTimerTick] = createSignal(0);
export { getTimerTick };

// false once the timer stops (finish, fail, restart)
const [isTimerRunning, setTimerRunning] = createSignal(false);
export { isTimerRunning };

// the timer drifted too far: animations stay off until it's cleared on restart.
const [isSlowTimer, setIsSlowTimer] = createSignal(false);
export { isSlowTimer };

function setSlowTimer(): void {
  if (isSlowTimer()) return;
  setIsSlowTimer(true);
  console.error("Slow timer, disabling animations");
}

function clearSlowTimer(): void {
  setIsSlowTimer(false);
}
const newTimer = createTimer({
  duration: 1000,
  autoplay: false,
  onComplete: () => {
    // sync guard — finish() is async and the phase flips behind an await
    if (stopped) return;

    const timerStartMs = getLiveCachedTimerStartMs();
    if (timerStartMs === null) {
      throw new Error("Timer start ms not found in cache");
    }

    const now = performance.now();
    const expectedThisFireMs = timerStartMs + (emittedTicks + 1) * 1000;
    const drift = roundTo2(now - expectedThisFireMs);

    // animejs is rAF-quantized and can fire fractionally early — reschedule
    // the remainder; bounded by rAF granularity, can't tight-loop
    if (drift < 0) {
      console.debug("Rescheduling timer, fired early by", -drift, "ms");
      newTimer.duration = expectedThisFireMs - now;
      newTimer.restart();
      return;
    }

    checkIfTimerIsSlow(drift);

    // Catch up missed ticks via the cheap timerStep path, so a stall recovery
    // doesn't pay N times for buildEventLog/WPM/UI. Each missed tick still
    // gets a step event + per-tick side effects (playTimeWarning, layoutfluid).
    const ticksDue = Math.floor((now - timerStartMs) / 1000);
    // oxlint-disable-next-line no-unmodified-loop-condition
    while (!stopped && emittedTicks + 1 < ticksDue) {
      console.debug(
        "Catching up timer, missed tick at",
        emittedTicks + 1,
        "seconds",
      );
      timerStep(now, true);
      logTestEvent("timer", now, {
        event: "step",
        timer: emittedTicks,
        slowTimer: isSlowTimer() ? true : undefined,
        catchup: true,
      });
    }
    // Gated on !stopped to avoid duplicating the last catch-up event when a
    // catch-up tick was the one that triggered finish. timerStep itself can
    // flip stopped (Time hits maxTime) — we still log because the tick ran.
    if (!stopped) {
      timerStep(now, false);
      logTestEvent("timer", now, {
        event: "step",
        timer: emittedTicks,
        slowTimer: isSlowTimer() ? true : undefined,
        drift,
      });
    }

    if (stopped) return;

    // Anchor to the ideal grid relative to test start (not `now`) so a late
    // tick doesn't permanently offset every tick after it.
    const expectedNextFireMs = timerStartMs + (emittedTicks + 1) * 1000;

    newTimer.duration = Math.max(0, expectedNextFireMs - now);
    newTimer.restart();
  },
});

type TimerStats = {
  dateNow: number;
  now: number;
  expected: number;
  nextDelay: number;
};

let slowTimerCount = 0;
let timer: NodeJS.Timeout | null = null;
const interval = 1000;
let expected = 0;

let slowTimerFailEnabled = true;
export function disableSlowTimerFail(): void {
  slowTimerFailEnabled = false;
}

let timerDebug = false;
export function enableTimerDebug(): void {
  timerDebug = true;
}

export function clear(logEnd = false, now = performance.now()): void {
  stopped = true;
  setTimerRunning(false);
  newTimer.reset();
  if (timer !== null) clearTimeout(timer);
  if (logEnd) {
    logTestEvent("timer", now, {
      event: "end",
      timer: getLiveCachedTestSeconds(now),
      date: new Date().getTime(),
    });
  }
}

function checkIfFailed(
  wpmAndRaw: { wpm: number; raw: number },
  acc: number | null,
): boolean {
  if (timerDebug) console.time("fail conditions");
  if (
    getTestSettings().minWpm === "custom" &&
    wpmAndRaw.wpm < getTestSettings().minWpmCustomSpeed &&
    getActiveWordIndex() > 3
  ) {
    if (timer !== null) clearTimeout(timer);
    clearSlowTimer();
    slowTimerCount = 0;
    onFail("min speed");
    return true;
  }
  if (
    getTestSettings().minAcc === "custom" &&
    acc !== null &&
    acc < getTestSettings().minAccCustom
  ) {
    if (timer !== null) clearTimeout(timer);
    clearSlowTimer();
    slowTimerCount = 0;
    onFail("min accuracy");
    return true;
  }
  if (timerDebug) console.timeEnd("fail conditions");
  return false;
}

function checkIfTimeIsUp(testTime: number): void {
  if (timerDebug) console.time("times up check");

  let maxTime = undefined;

  if (getTestSettings().mode === "time") {
    maxTime = getTestSettings().time;
  } else if (
    getTestSettings().mode === "custom" &&
    getTestSettings().customText.limit.mode === "time"
  ) {
    maxTime = getTestSettings().customText.limit.value;
  }
  if (maxTime !== undefined && maxTime !== 0 && testTime >= maxTime) {
    //times up
    if (timer !== null) clearTimeout(timer);
    clearSlowTimer();
    slowTimerCount = 0;
    onFinish();
    return;
  }

  if (timerDebug) console.timeEnd("times up check");
}

// ---------------------------------------

let timerStats: TimerStats[] = [];

export function getTimerStats(): TimerStats[] {
  return timerStats;
}

function timerStep(now: number, catchingUp: boolean): void {
  if (timerDebug) console.time("timer step -----------------------------");

  emittedTicks++;
  const testTime = emittedTicks;

  if (catchingUp) {
    // cheap per-tick side effects (timer-effects) must run for every missed
    // tick during catch-up so warnings/layout switches still fire on the
    // correct seconds
    setTimerTick(testTime);
    checkIfTimeIsUp(testTime);
  } else {
    //calc — only the final, real-time tick pays for these
    const eventLog = buildEventLog();

    const chars = getChars(eventLog, true);

    const currentTestDurationMs = getLiveCachedTestDurationMs(now);
    const acc = getLiveCachedAccuracy();
    const wpmAndRaw = {
      wpm: Math.round(
        calculateWpm(chars.correctWord, currentTestDurationMs / 1000),
      ),
      raw: Math.round(
        calculateWpm(
          chars.allCorrect + chars.extra + chars.incorrect,
          currentTestDurationMs / 1000,
        ),
      ),
    };

    setTimerLiveStats({
      wpm: wpmAndRaw.wpm,
      raw: wpmAndRaw.raw,
      seconds: getLiveCachedTestSeconds(now),
    });

    //logic
    setTimerTick(testTime);
    const failed = checkIfFailed(wpmAndRaw, acc);
    if (!failed) checkIfTimeIsUp(testTime);
  }

  if (timerDebug) console.timeEnd("timer step -----------------------------");
}

function checkIfTimerIsSlow(drift: number): void {
  if (!slowTimerFailEnabled) return;
  if (
    (getTestSettings().mode === "time" &&
      getTestSettings().time < 130 &&
      getTestSettings().time > 0) ||
    (getTestSettings().mode === "words" &&
      getTestSettings().words < 250 &&
      getTestSettings().words > 0)
  ) {
    if (drift > 125) {
      //slow timer
      setSlowTimer();
    }
    if (drift > 250) {
      slowTimerCount++;
    }

    if (drift > 500 || slowTimerCount > 5) {
      // test-logic's fail shows the notifications
      onFail("slow timer");
    }
  }
}

export async function start(
  now: number,
  handlers: TimerHandlers,
): Promise<void> {
  ({ onFinish, onFail } = handlers);
  clearSlowTimer();
  slowTimerCount = 0;
  emittedTicks = 0;
  setTimerTick(0);
  void _startNew(now);
  // void _startOld(now);
}

async function _startNew(now: number): Promise<void> {
  stopped = false;
  setTimerRunning(true);
  newTimer.duration = 1000;
  newTimer.play();
  logTestEvent("timer", now, {
    event: "start",
    timer: 0,
    date: new Date().getTime(),
  });
}

async function _startOld(now: number): Promise<void> {
  timerStats = [];
  expected = now + interval;
  logTestEvent("timer", now, {
    event: "start",
    timer: 0,
    date: new Date().getTime(),
  });
  (function loop(): void {
    const delay = expected - performance.now();
    timerStats.push({
      dateNow: Date.now(),
      now: performance.now(),
      expected: expected,
      nextDelay: delay,
    });
    const drift = roundTo2(Math.abs(interval - delay));
    checkIfTimerIsSlow(drift);
    timer = setTimeout(function () {
      if (!isTestActive()) {
        if (timer !== null) clearTimeout(timer);
        clearSlowTimer();
        slowTimerCount = 0;
        return;
      }

      const now = performance.now();

      logTestEvent("timer", now, {
        event: "step",
        timer: getLiveCachedTestSeconds(now),
        drift: drift,
        slowTimer: isSlowTimer() ? true : undefined,
      });

      timerStep(now, false);

      expected += interval;
      loop();
    }, delay);
  })();
}
