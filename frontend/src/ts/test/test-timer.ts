//most of the code is thanks to
//https://stackoverflow.com/questions/29971898/how-to-create-an-accurate-timer-in-javascript

import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import * as CustomText from "./custom-text";
import * as TestWords from "./test-words";
import {
  showNoticeNotification,
  showErrorNotification,
  removeNotification,
} from "../states/notifications";
import * as Caret from "./caret";
import * as SlowTimer from "../legacy-states/slow-timer";
import { timerEvent } from "../events/timer";
import { highlight } from "../events/keymap";
import * as LayoutfluidFunboxTimer from "../test/funbox/layoutfluid-funbox-timer";
import { KeymapLayout, Layout } from "@monkeytype/schemas/configs";
import * as SoundController from "../controllers/sound-controller";
import { clearLowFpsMode, setLowFpsMode } from "../anim";
import { createTimer } from "animejs";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { buildEventLog, getCurrentInput, logTestEvent } from "./events/data";
import { roundTo2 } from "@monkeytype/util/numbers";
import {
  getLiveCachedAccuracy,
  getLiveCachedTestDurationMs,
  getLiveCachedTestSeconds,
  getLiveCachedTimerStartMs,
} from "./events/live-cache";
import { getChars } from "./events/stats";
import { calculateWpm } from "../utils/numbers";
import {
  getActiveWordIndex,
  isTestActive,
  setCurrentLiveStats,
} from "../states/test";
import { updateLiveProgress } from "../components/pages/test/live-stats/util";

let emittedTicks = 0;
let stopped = true;
const newTimer = createTimer({
  duration: 1000,
  autoplay: false,
  onComplete: () => {
    // sync guard — finish() is async and isTestActive() flips behind an await
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
        slowTimer: SlowTimer.get() ? true : undefined,
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
        slowTimer: SlowTimer.get() ? true : undefined,
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
let slowTimerNotifIds: number[] = [];
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
  clearLowFpsMode();
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

function premid(testTime: number): void {
  if (timerDebug) console.time("premid");
  const premidSecondsLeft = document.querySelector("#premidSecondsLeft");

  if (premidSecondsLeft !== null) {
    premidSecondsLeft.innerHTML = (Config.time - testTime).toString();
  }
  if (timerDebug) console.timeEnd("premid");
}

function layoutfluid(time: number): void {
  if (timerDebug) console.time("layoutfluid");

  if (Config.funbox.includes("layoutfluid") && Config.mode === "time") {
    const layouts = Config.customLayoutfluid;
    const switchTime = Config.time / layouts.length;
    const index = Math.floor(time / switchTime);
    const layout = layouts[index];
    const flooredSwitchTimes = [];

    for (let i = 1; i < layouts.length; i++) {
      flooredSwitchTimes.push(Math.floor(switchTime * i));
    }

    if (flooredSwitchTimes.includes(time + 3)) {
      LayoutfluidFunboxTimer.show();
      LayoutfluidFunboxTimer.updateTime(3, layouts[index + 1] as string);
    } else if (flooredSwitchTimes.includes(time + 2)) {
      LayoutfluidFunboxTimer.updateTime(2, layouts[index + 1] as string);
    } else if (flooredSwitchTimes.includes(time + 1)) {
      LayoutfluidFunboxTimer.updateTime(1, layouts[index + 1] as string);
    }

    if (Config.layout !== layout && layout !== undefined) {
      LayoutfluidFunboxTimer.hide();
      setConfig("layout", layout as Layout, {
        nosave: true,
      });
      setConfig("keymapLayout", layout as KeymapLayout, {
        nosave: true,
      });

      if (Config.keymapMode === "next") {
        setTimeout(() => {
          highlight(
            TestWords.words
              .getCurrent()
              ?.text.charAt(getCurrentInput().length) ?? "",
          );
        }, 1);
      }
    }
  }
  if (timerDebug) console.timeEnd("layoutfluid");
}

function checkIfFailed(
  wpmAndRaw: { wpm: number; raw: number },
  acc: number,
): boolean {
  if (timerDebug) console.time("fail conditions");
  if (
    Config.minWpm === "custom" &&
    wpmAndRaw.wpm < Config.minWpmCustomSpeed &&
    getActiveWordIndex() > 3
  ) {
    if (timer !== null) clearTimeout(timer);
    SlowTimer.clear();
    slowTimerCount = 0;
    timerEvent.dispatch({ key: "fail", value: "min speed" });
    return true;
  }
  if (Config.minAcc === "custom" && acc < Config.minAccCustom) {
    if (timer !== null) clearTimeout(timer);
    SlowTimer.clear();
    slowTimerCount = 0;
    timerEvent.dispatch({ key: "fail", value: "min accuracy" });
    return true;
  }
  if (timerDebug) console.timeEnd("fail conditions");
  return false;
}

function checkIfTimeIsUp(testTime: number): void {
  if (timerDebug) console.time("times up check");

  let maxTime = undefined;

  if (Config.mode === "time") {
    maxTime = Config.time;
  } else if (Config.mode === "custom" && CustomText.getLimitMode() === "time") {
    maxTime = CustomText.getLimitValue();
  }
  if (maxTime !== undefined && maxTime !== 0 && testTime >= maxTime) {
    //times up
    if (timer !== null) clearTimeout(timer);
    Caret.hide();
    SlowTimer.clear();
    slowTimerCount = 0;
    timerEvent.dispatch({ key: "finish" });
    return;
  }

  if (timerDebug) console.timeEnd("times up check");
}

function playTimeWarning(testTime: number): void {
  if (timerDebug) console.time("play timer warning");

  let maxTime = undefined;

  if (Config.mode === "time") {
    maxTime = Config.time;
  } else if (Config.mode === "custom" && CustomText.getLimitMode() === "time") {
    maxTime = CustomText.getLimitValue();
  }

  if (
    maxTime !== undefined &&
    testTime === maxTime - parseInt(Config.playTimeWarning, 10)
  ) {
    void SoundController.playTimeWarning();
  }
  if (timerDebug) console.timeEnd("play timer warning");
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
    // cheap per-tick side effects — must run for every missed tick during catch-up
    // so warnings/layout switches still fire on the correct seconds
    if (Config.playTimeWarning !== "off") playTimeWarning(testTime);
    layoutfluid(testTime);
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

    //ui updates
    requestDebouncedAnimationFrame("test-timer.timerStep", () => {
      premid(testTime);
    });

    setCurrentLiveStats({ wpm: wpmAndRaw.wpm, acc, raw: wpmAndRaw.raw });
    updateLiveProgress();

    //logic
    if (Config.playTimeWarning !== "off") playTimeWarning(testTime);
    layoutfluid(testTime);
    const failed = checkIfFailed(wpmAndRaw, acc);
    if (!failed) checkIfTimeIsUp(testTime);
  }

  if (timerDebug) console.timeEnd("timer step -----------------------------");
}

function checkIfTimerIsSlow(drift: number): void {
  if (!slowTimerFailEnabled) return;
  if (
    (Config.mode === "time" && Config.time < 130 && Config.time > 0) ||
    (Config.mode === "words" && Config.words < 250 && Config.words > 0)
  ) {
    if (drift > 125) {
      //slow timer
      SlowTimer.set();
      setLowFpsMode();
    }
    if (drift > 250) {
      slowTimerCount++;
    }

    if (drift > 500 || slowTimerCount > 5) {
      //slow timer

      showNoticeNotification(
        'This could be caused by "efficiency mode" on Microsoft Edge.',
      );

      slowTimerNotifIds.push(
        showErrorNotification(
          "Stopping the test due to bad performance. This would cause test calculations to be incorrect. If this happens a lot, please report this.",
        ),
      );

      timerEvent.dispatch({ key: "fail", value: "slow timer" });
    }
  }
}

export async function start(now: number): Promise<void> {
  SlowTimer.clear();
  slowTimerCount = 0;
  emittedTicks = 0;
  for (const id of slowTimerNotifIds) {
    removeNotification(id, "clear");
  }
  slowTimerNotifIds = [];
  void _startNew(now);
  // void _startOld(now);
}

async function _startNew(now: number): Promise<void> {
  stopped = false;
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
        SlowTimer.clear();
        slowTimerCount = 0;
        return;
      }

      const now = performance.now();

      logTestEvent("timer", now, {
        event: "step",
        timer: getLiveCachedTestSeconds(now),
        drift: drift,
        slowTimer: SlowTimer.get() ? true : undefined,
      });

      timerStep(now, false);

      expected += interval;
      loop();
    }, delay);
  })();
}
